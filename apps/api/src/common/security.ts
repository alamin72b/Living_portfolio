import {
  BadRequestException,
  CanActivate,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  type ArgumentsHost,
  type ExecutionContext,
  type PipeTransform,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from '@blueprint/shared';
import { CONFIG, type Configuration } from '../config.js';
import { logger } from './logger.js';
export type AuthRequest = Request & { actor: 'owner' | 'agent' };
export const OwnerOnly = () => SetMetadata('ownerOnly', true);
function equal(a: string, b: string) {
  return timingSafeEqual(
    createHash('sha256').update(a).digest(),
    createHash('sha256').update(b).digest(),
  );
}
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @Inject(CONFIG) private readonly config: Configuration,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ') || raw.length > 1024)
      throw new UnauthorizedException('A valid owner or agent bearer token is required.');
    const token = raw.slice(7);
    if (equal(token, this.config.OWNER_TOKEN)) req.actor = 'owner';
    else if (equal(token, this.config.AGENT_TOKEN)) req.actor = 'agent';
    else throw new UnauthorizedException('Invalid access token.');
    if (
      this.reflector.getAllAndOverride<boolean>('ownerOnly', [
        context.getHandler(),
        context.getClass(),
      ]) &&
      req.actor !== 'owner'
    )
      throw new ForbiddenException('Only the owner can approve and publish content.');
    return true;
  }
}
export class SchemaPipe<T> implements PipeTransform {
  constructor(private schema: z.ZodType<T>) {}
  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success)
      throw new BadRequestException({
        message: 'Input validation failed.',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    return parsed.data;
  }
}
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const requestId = res.getHeader('x-request-id') ?? randomUUID();
    const parserType =
      typeof error === 'object' && error !== null && 'type' in error ? error.type : null;
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : parserType === 'entity.parse.failed'
          ? 400
          : parserType === 'entity.too.large'
            ? 413
            : 500;
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const body =
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const message =
      status >= 500
        ? 'The service could not complete this request. Check configuration and try again.'
        : (body.message ??
          (typeof payload === 'string'
            ? payload
            : status === 413
              ? 'Request body is too large.'
              : status === 400
                ? 'Invalid JSON body.'
                : 'Request rejected.'));
    if (status >= 500)
      logger.error({
        event: 'request.failure',
        requestId,
        status,
        errorType: error instanceof Error ? error.name : 'unknown',
      });
    res.status(status).json({
      statusCode: status,
      message,
      requestId,
      ...(body.issues ? { issues: body.issues } : {}),
    });
  }
}
