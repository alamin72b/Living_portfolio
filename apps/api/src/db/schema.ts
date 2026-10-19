import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  doublePrecision,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { DraftState, PieceContent, Profile, RelationType } from '@blueprint/shared';
export type RevisionBody =
  Omit<PieceContent, 'evidence' | 'media' | 'relationships' | 'position'> | Profile;
export const revisions = pgTable(
  'revisions',
  {
    id: uuid('id').primaryKey(),
    entityType: text('entity_type').$type<'piece' | 'profile'>().notNull(),
    entityId: uuid('entity_id').notNull(),
    number: integer('number').notNull(),
    baseRevisionId: uuid('base_revision_id'),
    body: jsonb('body').$type<RevisionBody>().notNull(),
    status: text('status').$type<DraftState>().notNull().default('draft'),
    createdBy: text('created_by').$type<'owner' | 'agent'>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    validatedVersion: integer('validated_version'),
    previewDigest: text('preview_digest'),
    approvalDigest: text('approval_digest'),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  },
  (t) => [uniqueIndex('revision_entity_number').on(t.entityType, t.entityId, t.number)],
);
export const pieces = pgTable('pieces', {
  id: uuid('id').primaryKey(),
  publishedRevisionId: uuid('published_revision_id').references(() => revisions.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});
export const siteState = pgTable('site_state', {
  id: integer('id').primaryKey(),
  version: integer('version').notNull().default(0),
  profileRevisionId: uuid('profile_revision_id').references(() => revisions.id),
});
export const revisionEvidence = pgTable('revision_evidence', {
  id: serial('id').primaryKey(),
  revisionId: uuid('revision_id')
    .notNull()
    .references(() => revisions.id),
  ordinal: integer('ordinal').notNull(),
  claim: text('claim').notNull(),
  url: text('url').notNull(),
  note: text('note').notNull(),
  visibility: text('visibility').$type<'private' | 'public'>().notNull(),
});
export const revisionMedia = pgTable('revision_media', {
  id: serial('id').primaryKey(),
  revisionId: uuid('revision_id')
    .notNull()
    .references(() => revisions.id),
  ordinal: integer('ordinal').notNull(),
  kind: text('kind').$type<'image' | 'video' | 'preview'>().notNull(),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
});
export const revisionRelationships = pgTable('revision_relationships', {
  id: serial('id').primaryKey(),
  revisionId: uuid('revision_id')
    .notNull()
    .references(() => revisions.id),
  targetId: uuid('target_id')
    .notNull()
    .references(() => pieces.id),
  type: text('type').$type<RelationType>().notNull(),
  note: text('note').notNull(),
});
export const revisionLayouts = pgTable('revision_layouts', {
  revisionId: uuid('revision_id')
    .primaryKey()
    .references(() => revisions.id),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
});
export const layouts = pgTable('layouts', {
  pieceId: uuid('piece_id')
    .primaryKey()
    .references(() => pieces.id),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
});
export const connections = pgTable(
  'connections',
  {
    id: uuid('id').primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => pieces.id),
    targetId: uuid('target_id')
      .notNull()
      .references(() => pieces.id),
    type: text('type').$type<RelationType>().notNull(),
    note: text('note').notNull(),
  },
  (t) => [uniqueIndex('unique_connection').on(t.sourceId, t.targetId, t.type)],
);
export const auditEvents = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  actor: text('actor').notNull(),
  revisionId: uuid('revision_id').references(() => revisions.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
});
