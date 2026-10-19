import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { PortfolioService } from './portfolio.service.js';
import { Database } from '../db/database.js';
@ApiTags('Public portfolio')
@Controller()
export class PublicController {
  constructor(
    @Inject(PortfolioService) private readonly portfolio: PortfolioService,
    @Inject(Database) private readonly db: Database,
  ) {}
  @Get('workspace')
  @ApiOperation({
    summary: 'Published pieces, relationships, layout, and profile; private evidence is excluded.',
  })
  workspace() {
    return this.portfolio.workspace();
  }
  @Get('profile')
  @ApiOperation({ summary: 'Published profile or the honest initial introduction.' })
  async profile() {
    return (await this.portfolio.workspace()).profile;
  }
  @Get('pieces/:id')
  @ApiOperation({ summary: 'A published creation by its stable UUID.' })
  async piece(@Param('id', new ParseUUIDPipe()) id: string) {
    const p = (await this.portfolio.workspace()).pieces.find((p) => p.id === id);
    if (!p) throw new NotFoundException('Published piece not found.');
    return p;
  }
  @Get('health') @ApiOperation({ summary: 'Process liveness.' }) health() {
    return { status: 'ok', service: 'living-blueprint-api' };
  }
  @Get('health/ready')
  @ApiOperation({ summary: 'Database and migration readiness.' })
  async ready() {
    try {
      await this.db.orm.execute(sql`SELECT version FROM site_state WHERE id=1`);
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Database is not ready.');
    }
  }
}
