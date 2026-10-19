import { eq, inArray, asc, desc, isNotNull, and, sql } from 'drizzle-orm';
import { NotFoundException } from '@nestjs/common';
import {
  defaultProfile,
  pieceSchema,
  publicPiece,
  type Piece,
  type PieceContent,
  type Profile,
  type Revision,
  type Workspace,
} from '@blueprint/shared';
import type { Session } from '../db/database.js';
import * as s from '../db/schema.js';
export async function hydrate(
  rows: (typeof s.revisions.$inferSelect)[],
  db: Session,
): Promise<Revision[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [evidence, media, relationships, positions] = await Promise.all([
    db
      .select()
      .from(s.revisionEvidence)
      .where(inArray(s.revisionEvidence.revisionId, ids))
      .orderBy(asc(s.revisionEvidence.ordinal)),
    db
      .select()
      .from(s.revisionMedia)
      .where(inArray(s.revisionMedia.revisionId, ids))
      .orderBy(asc(s.revisionMedia.ordinal)),
    db
      .select()
      .from(s.revisionRelationships)
      .where(inArray(s.revisionRelationships.revisionId, ids))
      .orderBy(asc(s.revisionRelationships.id)),
    db.select().from(s.revisionLayouts).where(inArray(s.revisionLayouts.revisionId, ids)),
  ]);
  return rows.map((r) => {
    const content =
      r.entityType === 'profile'
        ? (r.body as Profile)
        : pieceSchema.parse({
            ...(r.body as Omit<PieceContent, 'evidence' | 'media' | 'relationships' | 'position'>),
            position: positions
              .filter((x) => x.revisionId === r.id)
              .map((x) => ({ x: x.x, y: x.y }))[0],
            evidence: evidence
              .filter((x) => x.revisionId === r.id)
              .map((x) => ({ claim: x.claim, url: x.url, note: x.note, visibility: x.visibility })),
            media: media
              .filter((x) => x.revisionId === r.id)
              .map((x) => ({ kind: x.kind, url: x.url, alt: x.alt })),
            relationships: relationships
              .filter((x) => x.revisionId === r.id)
              .map((x) => ({ targetId: x.targetId, type: x.type, note: x.note })),
          });
    return {
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      number: r.number,
      baseRevisionId: r.baseRevisionId,
      status: r.status,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
      approvalDigest: r.approvalDigest,
      content,
    };
  });
}
export async function revisionRow(db: Session, id: string) {
  const [row] = await db.select().from(s.revisions).where(eq(s.revisions.id, id));
  if (!row) throw new NotFoundException('Revision not found.');
  return row;
}
export async function revisionById(db: Session, id: string) {
  return (await hydrate([await revisionRow(db, id)], db))[0];
}
export async function workspaceSnapshot(
  db: Session,
  previewOrigins: string[],
  privateEvidence = false,
): Promise<Workspace> {
  const [state] = await db.select().from(s.siteState).where(eq(s.siteState.id, 1));
  if (!state) throw new Error('Database not initialized. Run migrations.');
  const entries = await db
    .select()
    .from(s.pieces)
    .where(isNotNull(s.pieces.publishedRevisionId))
    .orderBy(asc(s.pieces.createdAt));
  const ids = entries.map((p) => p.publishedRevisionId!);
  const revisions = ids.length
    ? await hydrate(await db.select().from(s.revisions).where(inArray(s.revisions.id, ids)), db)
    : [];
  const positions = await db.select().from(s.layouts);
  const relationships = await db.select().from(s.connections).orderBy(asc(s.connections.id));
  const published = entries.map((entry) => {
    const r = revisions.find((r) => r.id === entry.publishedRevisionId)!;
    const position = positions.find((p) => p.pieceId === entry.id);
    const piece: Piece = {
      ...(r.content as PieceContent),
      id: entry.id,
      revisionId: r.id,
      revisionNumber: r.number,
      position: position ? { x: position.x, y: position.y } : (r.content as PieceContent).position,
    };
    return privateEvidence ? piece : publicPiece(piece);
  });
  const profile = state.profileRevisionId
    ? ((await revisionById(db, state.profileRevisionId)).content as Profile)
    : defaultProfile;
  return {
    version: state.version,
    profile,
    profileRevisionId: state.profileRevisionId,
    pieces: published,
    connections: relationships,
    previewOrigins,
  };
}
export async function listRevisions(db: Session, limit: number, offset: number) {
  return hydrate(
    await db
      .select()
      .from(s.revisions)
      .orderBy(desc(s.revisions.createdAt), desc(s.revisions.id))
      .limit(limit)
      .offset(offset),
    db,
  );
}
export async function nextRevisionNumber(
  db: Session,
  entityId: string,
  entityType: 'piece' | 'profile',
) {
  const [value] = await db
    .select({ n: sql<number>`coalesce(max(${s.revisions.number}),0)::int` })
    .from(s.revisions)
    .where(and(eq(s.revisions.entityId, entityId), eq(s.revisions.entityType, entityType)));
  return value.n + 1;
}
