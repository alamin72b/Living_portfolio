import 'reflect-metadata';
import { ForbiddenException, Global, Module, type DynamicModule } from '@nestjs/common';
import { NestFactory, APP_GUARD, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  getOptionsToken,
  getStorageToken,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { json, type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import { CONFIG, readConfig, type Configuration } from './config.js';
import { Database } from './db/database.js';
import { PortfolioService } from './portfolio/portfolio.service.js';
import { PublicController } from './portfolio/public.controller.js';
import { AdminController } from './publishing/admin.controller.js';
import { AuthorizationGuard, ErrorFilter } from './common/security.js';
import { logger } from './common/logger.js';
import {
  EvidenceOnlyProvider,
  PreparationService,
  PREPARATION_PROVIDER,
} from './ai/preparation.js';
@Global()
@Module({})
class CoreModule {
  static configure(config: Configuration, database?: Database): DynamicModule {
    return {
      module: CoreModule,
      providers: [
        { provide: CONFIG, useValue: config },
        database ? { provide: Database, useValue: database } : Database,
        Reflector,
        AuthorizationGuard,
      ],
      exports: [CONFIG, Database, Reflector, AuthorizationGuard],
    };
  }
}
@Module({
  providers: [PortfolioService],
  controllers: [PublicController],
  exports: [PortfolioService],
})
class PortfolioModule {}
@Module({
  providers: [
    PreparationService,
    { provide: PREPARATION_PROVIDER, useClass: EvidenceOnlyProvider },
  ],
  exports: [PreparationService],
})
class PreparationModule {}
@Module({ imports: [PortfolioModule, PreparationModule], controllers: [AdminController] })
class PublishingModule {}
export async function createApplication(
  options: { config?: Configuration; database?: Database } = {},
) {
  const config = options.config ?? readConfig();
  @Module({
    imports: [
      CoreModule.configure(config, options.database),
      ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 300 }]),
      PortfolioModule,
      PublishingModule,
    ],
    providers: [
      {
        provide: APP_GUARD,
        useFactory: (
          options: ConstructorParameters<typeof ThrottlerGuard>[0],
          storage: ConstructorParameters<typeof ThrottlerGuard>[1],
        ) => new ThrottlerGuard(options, storage, new Reflector()),
        inject: [getOptionsToken(), getStorageToken()],
      },
    ],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    logger: false,
    bodyParser: false,
    abortOnError: false,
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('x-request-id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    const start = Date.now();
    res.on('finish', () =>
      logger.info({
        event: 'http.request',
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      }),
    );
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy: config.SWAGGER_ENABLED
        ? {
            directives: {
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
            },
          }
        : undefined,
    }),
  );
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) =>
      !origin || config.CORS_ORIGINS.includes(origin)
        ? callback(null, true)
        : callback(new ForbiddenException('Origin is not allowed.'), false),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
  });
  app.use(json({ limit: '256kb' }));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();
  const openApi = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('The Living Blueprint API')
      .setDescription(
        'Public evidence-based portfolio. Private preparation uses agent tokens; publication requires explicit owner approval.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build(),
  );
  if (config.SWAGGER_ENABLED)
    SwaggerModule.setup('api/docs', app, openApi, {
      swaggerOptions: { persistAuthorization: false },
    });
  await app.init();
  return { app, config, openApi };
}
