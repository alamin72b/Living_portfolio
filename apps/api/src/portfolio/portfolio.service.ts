import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import {
  contentWarnings,
  draftSchema,
  graphErrors,
  hasLikelySecret,
  publicPiece,
  type DraftInput,
  type Piece,
  type PieceContent,
  type Preview,
  type Profile,
  type Revision,
  type Workspace,
} from '@blueprint/shared';
import { Database, type Session } from '../db/database.js';
import { CONFIG, type Configuration } from '../config.js';
import * as s from '../db/schema.js';
import {
  hydrate,
  listRevisions,
  nextRevisionNumber,
  revisionById,
  revisionRow,
  workspaceSnapshot,
} from './repository.js';
type Actor = 'owner' | 'agent';
const PROFILE_ID = '00000000-0000-4000-8000-000000000000';
function edgeId(source: string, target: string, type: string) {
  const h = createHash('sha256').update(`${source}:${target}:${type}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
function digest(r: Revision, version: number) {
  return createHash('sha256')
    .update(JSON.stringify({ id: r.id, content: r.content, version }))
    .digest('hex');
}
@Injectable()
export class PortfolioService {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(CONFIG) private readonly config: Configuration,
  ) {}
  async workspace(privateEvidence = false): Promise<Workspace> {
    return this.db.orm.transaction(
      (tx) => workspaceSnapshot(tx, this.config.PREVIEW_ORIGINS, privateEvidence),
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );
  }
  async revisions(limit = 100, offset = 0) {
    return { revisions: await listRevisions(this.db.orm, limit, offset), limit, offset };
  }
  async getRevision(id: string) {
    return revisionById(this.db.orm, id);
  }
  async getPiece(id: string) {
    const [piece] = await this.db.orm.select().from(s.pieces).where(eq(s.pieces.id, id));
    if (!piece?.publishedRevisionId) throw new NotFoundException('Published piece not found.');
    return revisionById(this.db.orm, piece.publishedRevisionId);
  }
  private async locked<T>(fn: (tx: Session) => Promise<T>): Promise<T> {
    return this.db.orm.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(817263)`);
      return fn(tx);
    });
  }
  private async audit(
    tx: Session,
    action: string,
    actor: Actor,
    revisionId: string,
    metadata: Record<string, unknown> = {},
  ) {
    await tx.insert(s.auditEvents).values({ action, actor, revisionId, metadata });
  }
  async createDraft(input: DraftInput, actor: Actor) {
    const parsed = draftSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException('Invalid draft. Check required fields and URL formats.');
    if (hasLikelySecret(parsed.data.content))
      throw new BadRequestException(
        'Potential secret detected. Remove credentials from the proposed content.',
      );
    return this.locked((tx) => this.insertDraft(tx, parsed.data, actor));
  }
  private async insertDraft(tx: Session, input: DraftInput, actor: Actor): Promise<Revision> {
    const entityId = input.entityType === 'piece' ? (input.pieceId ?? randomUUID()) : PROFILE_ID;
    const [state] = await tx.select().from(s.siteState).where(eq(s.siteState.id, 1));
    let current: string | null = null;
    if (input.entityType === 'piece') {
      if (input.pieceId) {
        const [p] = await tx.select().from(s.pieces).where(eq(s.pieces.id, input.pieceId));
        if (!p) throw new NotFoundException('Piece not found.');
        current = p.publishedRevisionId;
      } else {
        const [count] = await tx.select({ count: sql<number>`count(*)::int` }).from(s.pieces);
        if (count.count >= 1000)
          throw new BadRequestException(
            'This installation supports 1,000 pieces. Review scaling before adding more.',
          );
        await tx.insert(s.pieces).values({ id: entityId });
      }
    } else current = state.profileRevisionId;
    if (input.baseRevisionId !== current)
      throw new ConflictException(
        'The published revision changed. Reload the piece and prepare a new draft.',
      );
    const id = randomUUID();
    const number = await nextRevisionNumber(tx, entityId, input.entityType);
    if (input.entityType === 'piece') {
      const { evidence, media, relationships, position, ...body } = input.content;
      const targetIds = relationships.map((r) => r.targetId);
      if (targetIds.includes(entityId))
        throw new BadRequestException('A piece cannot refer to itself.');
      const seen = new Set<string>();
      for (const r of relationships) {
        const key = `${r.targetId}:${r.type}`;
        if (seen.has(key)) throw new BadRequestException('Duplicate relationship.');
        seen.add(key);
        const [target] = await tx.select().from(s.pieces).where(eq(s.pieces.id, r.targetId));
        if (!target?.publishedRevisionId)
          throw new BadRequestException(
            'Relationships must refer to an existing published piece. Publish constituents first.',
          );
      }
      await tx.insert(s.revisions).values({
        id,
        entityType: input.entityType,
        entityId,
        number,
        baseRevisionId: current,
        body,
        createdBy: actor,
      });
      if (evidence.length)
        await tx
          .insert(s.revisionEvidence)
          .values(evidence.map((e, ordinal) => ({ ...e, revisionId: id, ordinal })));
      if (media.length)
        await tx
          .insert(s.revisionMedia)
          .values(media.map((m, ordinal) => ({ ...m, revisionId: id, ordinal })));
      if (relationships.length)
        await tx
          .insert(s.revisionRelationships)
          .values(relationships.map((r) => ({ ...r, revisionId: id })));
      await tx.insert(s.revisionLayouts).values({ revisionId: id, ...position });
    } else
      await tx.insert(s.revisions).values({
        id,
        entityType: 'profile',
        entityId,
        number,
        baseRevisionId: current,
        body: input.content,
        createdBy: actor,
      });
    await this.audit(tx, 'draft.created', actor, id);
    return revisionById(tx, id);
  }
  private async project(tx: Session, r: Revision): Promise<Workspace> {
    const workspace = await workspaceSnapshot(tx, this.config.PREVIEW_ORIGINS, true);
    const current =
      r.entityType === 'profile'
        ? workspace.profileRevisionId
        : (workspace.pieces.find((p) => p.id === r.entityId)?.revisionId ?? null);
    if (current !== r.baseRevisionId)
      throw new ConflictException(
        'This draft is based on an old revision. Create a fresh draft from the current piece.',
      );
    if (r.entityType === 'profile')
      return {
        ...workspace,
        profile: r.content as Profile,
        profileRevisionId: r.id,
        pieces: workspace.pieces.map(publicPiece),
      };
    const content = r.content as PieceContent;
    const candidate: Piece = {
      ...content,
      id: r.entityId,
      revisionId: r.id,
      revisionNumber: r.number,
    };
    const pieces = [...workspace.pieces.filter((p) => p.id !== r.entityId), candidate];
    const connections = [
      ...workspace.connections.filter((e) => e.sourceId !== r.entityId),
      ...content.relationships.map((e) => ({
        ...e,
        sourceId: r.entityId,
        id: edgeId(r.entityId, e.targetId, e.type),
      })),
    ];
    const errors = graphErrors(pieces, connections);
    if (errors.length) throw new BadRequestException(errors.join(' '));
    if (hasLikelySecret(content)) throw new BadRequestException('Potential secret detected.');
    return { ...workspace, pieces: pieces.map(publicPiece), connections };
  }
  async validate(id: string, actor: Actor) {
    return this.locked(async (tx) => {
      const r = await revisionById(tx, id);
      if (['published', 'superseded'].includes(r.status))
        throw new ConflictException('Published revisions are immutable. Create a new draft.');
      const projected = await this.project(tx, r);
      await tx
        .update(s.revisions)
        .set({
          status: 'validated',
          validatedVersion: projected.version,
          previewDigest: null,
          approvalDigest: null,
          approvedAt: null,
        })
        .where(eq(s.revisions.id, id));
      await this.audit(tx, 'draft.validated', actor, id, { workspaceVersion: projected.version });
      return {
        valid: true,
        warnings: r.entityType === 'piece' ? contentWarnings(r.content as PieceContent) : [],
        workspaceVersion: projected.version,
      };
    });
  }
  async preview(id: string, actor: Actor): Promise<Preview> {
    return this.locked(async (tx) => {
      const row = await revisionRow(tx, id);
      if (!['validated', 'approved'].includes(row.status))
        throw new ConflictException('Validate this draft before previewing it.');
      const r = (await hydrate([row], tx))[0];
      const workspace = await this.project(tx, r);
      if (row.validatedVersion !== workspace.version)
        throw new ConflictException('The workspace changed. Validate and preview again.');
      const hash = digest(r, workspace.version);
      await tx.update(s.revisions).set({ previewDigest: hash }).where(eq(s.revisions.id, id));
      await this.audit(tx, 'draft.previewed', actor, id, { workspaceVersion: workspace.version });
      return {
        revision: r,
        workspace,
        digest: hash,
        warnings: r.entityType === 'piece' ? contentWarnings(r.content as PieceContent) : [],
      };
    });
  }
  async approve(id: string, hash: string, actor: Actor) {
    if (actor !== 'owner') throw new BadRequestException('Only the owner can approve.');
    return this.locked(async (tx) => {
      const row = await revisionRow(tx, id);
      if (row.status !== 'validated')
        throw new ConflictException('Validate and preview before approval.');
      const r = (await hydrate([row], tx))[0];
      const workspace = await this.project(tx, r);
      if (
        row.previewDigest !== hash ||
        digest(r, workspace.version) !== hash ||
        row.validatedVersion !== workspace.version
      )
        throw new ConflictException('The preview is stale or missing. Validate and preview again.');
      await tx
        .update(s.revisions)
        .set({ status: 'approved', approvalDigest: hash, approvedAt: new Date().toISOString() })
        .where(eq(s.revisions.id, id));
      await this.audit(tx, 'draft.approved', actor, id, { workspaceVersion: workspace.version });
      return revisionById(tx, id);
    });
  }
  async publish(id: string, hash: string, actor: Actor) {
    if (actor !== 'owner') throw new BadRequestException('Only the owner can publish.');
    return this.locked(async (tx) => {
      const row = await revisionRow(tx, id);
      if (row.status !== 'approved' || row.approvalDigest !== hash)
        throw new ConflictException('An exact owner-approved preview is required.');
      const r = (await hydrate([row], tx))[0];
      const workspace = await this.project(tx, r);
      if (digest(r, workspace.version) !== hash)
        throw new ConflictException(
          'The workspace changed after approval. Validate, preview, and approve again.',
        );
      if (r.entityType === 'piece') {
        const content = r.content as PieceContent;
        await tx
          .update(s.pieces)
          .set({ publishedRevisionId: id })
          .where(eq(s.pieces.id, r.entityId));
        await tx
          .insert(s.layouts)
          .values({ pieceId: r.entityId, ...content.position })
          .onConflictDoUpdate({ target: s.layouts.pieceId, set: content.position });
        await tx.delete(s.connections).where(eq(s.connections.sourceId, r.entityId));
        const outgoing = workspace.connections.filter((e) => e.sourceId === r.entityId);
        if (outgoing.length) await tx.insert(s.connections).values(outgoing);
      } else
        await tx.update(s.siteState).set({ profileRevisionId: id }).where(eq(s.siteState.id, 1));
      if (r.baseRevisionId)
        await tx
          .update(s.revisions)
          .set({ status: 'superseded' })
          .where(eq(s.revisions.id, r.baseRevisionId));
      await tx
        .update(s.revisions)
        .set({ status: 'published', publishedAt: new Date().toISOString() })
        .where(eq(s.revisions.id, id));
      await tx
        .update(s.siteState)
        .set({ version: workspace.version + 1 })
        .where(eq(s.siteState.id, 1));
      await this.audit(tx, 'revision.published', actor, id, {
        workspaceVersion: workspace.version + 1,
      });
      return { published: true, revisionId: id, workspaceVersion: workspace.version + 1 };
    });
  }
  async rollback(id: string, actor: Actor) {
    return this.locked(async (tx) => {
      const r = await revisionById(tx, id);
      if (!['published', 'superseded'].includes(r.status))
        throw new BadRequestException('Rollback uses a previously published revision.');
      const workspace = await workspaceSnapshot(tx, this.config.PREVIEW_ORIGINS, true);
      const input: DraftInput =
        r.entityType === 'piece'
          ? {
              entityType: 'piece',
              pieceId: r.entityId,
              baseRevisionId: workspace.pieces.find((p) => p.id === r.entityId)?.revisionId ?? null,
              content: r.content as PieceContent,
            }
          : {
              entityType: 'profile',
              baseRevisionId: workspace.profileRevisionId,
              content: r.content as Profile,
            };
      const draft = await this.insertDraft(tx, input, actor);
      await this.audit(tx, 'rollback.prepared', actor, draft.id, { fromRevision: id });
      return draft;
    });
  }
  async auditLog() {
    return this.db.orm
      .select()
      .from(s.auditEvents)
      .orderBy(sql`${s.auditEvents.id} DESC`)
      .limit(200);
  }
}
