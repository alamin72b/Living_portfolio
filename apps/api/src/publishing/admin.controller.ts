import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ApiBodyOptions } from '@nestjs/swagger';
type SchemaObject = Extract<ApiBodyOptions, { schema: unknown }>['schema'];
import { Throttle } from '@nestjs/throttler';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  approvalSchema,
  draftSchema,
  ingestionSchema,
  publishSchema,
  z,
  type DraftInput,
} from '@blueprint/shared';
import { PortfolioService } from '../portfolio/portfolio.service.js';
import { PreparationService } from '../ai/preparation.js';
import { AuthorizationGuard, OwnerOnly, SchemaPipe, type AuthRequest } from '../common/security.js';
const empty = z.object({}).strict();
const paging = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(100),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();
const schema = (value: unknown) =>
  zodToJsonSchema(value as Parameters<typeof zodToJsonSchema>[0], {
    $refStrategy: 'none',
    target: 'openApi3',
  }) as SchemaObject;
@ApiTags('Private content management')
@ApiBearerAuth()
@UseGuards(AuthorizationGuard)
@Controller('admin')
export class AdminController {
  constructor(
    @Inject(PortfolioService) private readonly portfolio: PortfolioService,
    @Inject(PreparationService) private readonly preparation: PreparationService,
  ) {}
  @Get('session')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Check an owner/agent token. Tokens are never returned.' })
  session(@Req() req: AuthRequest) {
    return { role: req.actor };
  }
  @Get('workspace')
  @ApiOperation({ summary: 'Owner/agent workspace including private review evidence.' })
  workspace() {
    return this.portfolio.workspace(true);
  }
  @Get('revisions')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOperation({ summary: 'Paginated immutable revision history.' })
  revisions(@Query(new SchemaPipe(paging)) query: z.infer<typeof paging>) {
    return this.portfolio.revisions(query.limit, query.offset);
  }
  @Get('revisions/:id') @ApiOperation({ summary: 'Read a private revision.' }) revision(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.portfolio.getRevision(id);
  }
  @Get('pieces/:id')
  @ApiOperation({ summary: 'Read the current full revision to prepare a safe update.' })
  piece(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.portfolio.getPiece(id);
  }
  @Get('audit')
  @OwnerOnly()
  @ApiOperation({ summary: 'Owner-only publication and approval audit trail.' })
  audit() {
    return this.portfolio.auditLog();
  }
  @Post('drafts')
  @ApiBody({ schema: schema(draftSchema) })
  @ApiOperation({
    summary:
      'Create an immutable private draft. Updates retain pieceId and require baseRevisionId.',
  })
  create(@Body(new SchemaPipe(draftSchema)) input: DraftInput, @Req() req: AuthRequest) {
    return this.portfolio.createDraft(input, req.actor);
  }
  @Post('ingestions')
  @ApiBody({ schema: schema(ingestionSchema) })
  @ApiOperation({
    summary:
      'Prepare a provider-independent proposal from supplied facts. Does NOT inspect or execute the repository.',
  })
  async prepare(@Body(new SchemaPipe(ingestionSchema)) input: z.infer<typeof ingestionSchema>) {
    return this.preparation.prepare(input, await this.portfolio.workspace(true));
  }
  @Post('revisions/:id/validate')
  @ApiBody({ schema: schema(empty) })
  @ApiOperation({ summary: 'Validate schema, graph, base revision, and potential secrets.' })
  validate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new SchemaPipe(empty)) _input: Record<string, never>,
    @Req() req: AuthRequest,
  ) {
    return this.portfolio.validate(id, req.actor);
  }
  @Get('revisions/:id/preview')
  @ApiOperation({
    summary:
      'Return a private projected workspace and digest of the exact revision/workspace version.',
  })
  preview(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AuthRequest) {
    return this.portfolio.preview(id, req.actor);
  }
  @Post('revisions/:id/approve')
  @OwnerOnly()
  @ApiBody({ schema: schema(approvalSchema) })
  @ApiOperation({ summary: 'Owner attests to evidence and approves an exact preview digest.' })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new SchemaPipe(approvalSchema)) input: z.infer<typeof approvalSchema>,
    @Req() req: AuthRequest,
  ) {
    return this.portfolio.approve(id, input.digest, req.actor);
  }
  @Post('revisions/:id/publish')
  @OwnerOnly()
  @ApiBody({ schema: schema(publishSchema) })
  @ApiOperation({
    summary:
      'Atomically publish the owner-approved revision. Reject stale approval and concurrent conflicts.',
  })
  publish(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new SchemaPipe(publishSchema)) input: z.infer<typeof publishSchema>,
    @Req() req: AuthRequest,
  ) {
    return this.portfolio.publish(id, input.digest, req.actor);
  }
  @Post('revisions/:id/rollback')
  @ApiBody({ schema: schema(empty) })
  @ApiOperation({
    summary:
      'Create a new draft from history. Rollback still requires validation, preview, owner approval, and publication.',
  })
  rollback(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new SchemaPipe(empty)) _input: Record<string, never>,
    @Req() req: AuthRequest,
  ) {
    return this.portfolio.rollback(id, req.actor);
  }
}
