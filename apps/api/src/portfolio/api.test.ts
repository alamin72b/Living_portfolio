import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import type { INestApplication } from '@nestjs/common';
import {
  defaultProfile,
  sampleWorkspace,
  type PieceContent,
  type Preview,
  type Revision,
  type Workspace,
} from '@blueprint/shared';
import { createApplication } from '../app.js';
import type { Configuration } from '../config.js';
import { Database } from '../db/database.js';
import * as schema from '../db/schema.js';
import { provisionAppRole } from '../db/provision.js';
const OWNER = 'test-owner-token-'.repeat(4),
  AGENT = 'test-agent-token-'.repeat(4);
let app: INestApplication, pg: PGlite | undefined, native: Database | undefined;
let http: ReturnType<typeof supertest>;
const config: Configuration = {
  NODE_ENV: 'test',
  PORT: 3001,
  HOST: '127.0.0.1',
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://unused:unused@localhost/unused',
  OWNER_TOKEN: OWNER,
  AGENT_TOKEN: AGENT,
  CORS_ORIGINS: ['http://localhost:5173'],
  PREVIEW_ORIGINS: ['https://example.com'],
  SWAGGER_ENABLED: true,
};
const makeContent = (title = 'Test fragment'): PieceContent => {
  const { id: _id, revisionId: _rid, revisionNumber: _rn, ...content } = sampleWorkspace.pieces[0];
  return {
    ...content,
    title,
    attribution: 'owner',
    stage: 'working',
    repositoryUrl: 'https://github.com/example/example',
    evidence: [
      {
        claim: 'A verified behavior',
        url: 'https://example.com/evidence',
        note: 'PRIVATE REVIEW NOTE',
        visibility: 'private',
      },
    ],
  };
};
async function create(
  content = makeContent(),
  pieceId?: string,
  baseRevisionId: string | null = null,
) {
  const result = await http
    .post('/api/v1/admin/drafts')
    .auth(AGENT, { type: 'bearer' })
    .send({ entityType: 'piece', pieceId, baseRevisionId, content })
    .expect(201);
  return result.body as Revision;
}
async function preview(id: string) {
  await http
    .post(`/api/v1/admin/revisions/${id}/validate`)
    .auth(AGENT, { type: 'bearer' })
    .send({})
    .expect(201);
  return (
    await http
      .get(`/api/v1/admin/revisions/${id}/preview`)
      .auth(AGENT, { type: 'bearer' })
      .expect(200)
  ).body as Preview;
}
async function approve(id: string, digest: string) {
  await http
    .post(`/api/v1/admin/revisions/${id}/approve`)
    .auth(OWNER, { type: 'bearer' })
    .send({ digest, verified: true })
    .expect(201);
}
async function publish(r: Revision) {
  const p = await preview(r.id);
  await approve(r.id, p.digest);
  await http
    .post(`/api/v1/admin/revisions/${r.id}/publish`)
    .auth(OWNER, { type: 'bearer' })
    .send({ digest: p.digest })
    .expect(201);
  return r;
}
beforeAll(async () => {
  const migration = await readFile(
    new URL('../../migrations/0001_initial.sql', import.meta.url),
    'utf8',
  );
  let database: Database;
  if (process.env.TEST_DATABASE_URL) {
    native = new Database(config);
    await native.pool.query(migration);
    database = native;
  } else {
    pg = new PGlite();
    await pg.exec(migration);
    await provisionAppRole(
      (text, values) => pg!.query(text, values),
      'blueprint_api_test',
      'test-only-local-password-123456',
    );
    await pg.exec('SET ROLE blueprint_api_test');
    database = {
      orm: drizzle(pg, { schema }),
      onModuleDestroy: async () => {},
    } as unknown as Database;
  }
  ({ app } = await createApplication({ config, database }));
  http = supertest(app.getHttpServer());
});
afterAll(async () => {
  await app?.close();
  await pg?.close();
});
describe('Real Nest HTTP API with PostgreSQL-compatible persistence', () => {
  it('starts honestly empty and reports database readiness', async () => {
    const res = await http.get('/api/v1/workspace').expect(200);
    expect(res.body.pieces).toEqual([]);
    expect(res.body.profile.name).toBe(defaultProfile.name);
    await http.get('/api/v1/health/ready').expect(200);
  });
  it('rejects missing, wrong, and overlong credentials', async () => {
    await http.get('/api/v1/admin/revisions').expect(401);
    await http.get('/api/v1/admin/revisions').auth('wrong', { type: 'bearer' }).expect(401);
    await http
      .get('/api/v1/admin/revisions')
      .auth('x'.repeat(2000), { type: 'bearer' })
      .expect(401);
  });
  it('rejects unapproved cross-origin requests', async () => {
    await http.get('/api/v1/workspace').set('Origin', 'https://untrusted.example').expect(403);
    await http
      .get('/api/v1/workspace')
      .set('Origin', 'http://localhost:5173')
      .expect('access-control-allow-origin', 'http://localhost:5173')
      .expect(200);
  });
  it('documents real request schemas in OpenAPI', async () => {
    const res = await http.get('/api/docs-json').expect(200);
    expect(
      res.body.paths['/api/v1/admin/drafts'].post.requestBody.content['application/json'].schema,
    ).toHaveProperty('anyOf');
  });
  it('validates unknown properties, unsafe URLs, invalid IDs and negative pagination', async () => {
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({ entityType: 'piece', content: makeContent(), unexpected: true })
      .expect(400);
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({
        entityType: 'piece',
        content: { ...makeContent(), repositoryUrl: 'javascript:alert(1)' },
      })
      .expect(400);
    await http.get('/api/v1/pieces/not-a-uuid').expect(400);
    await http.get('/api/v1/admin/revisions?limit=-1').auth(OWNER, { type: 'bearer' }).expect(400);
  });
  it('rejects malformed JSON and oversized bodies consistently', async () => {
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({ text: 'x'.repeat(270000) })
      .expect(413);
  });
  it('blocks likely secrets before persisting a draft', async () => {
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({
        entityType: 'piece',
        content: { ...makeContent(), body: '-----BEGIN PRIVATE KEY-----' },
      })
      .expect(400);
  });
  it('keeps drafts private, forbids agent approval and publish, then publishes with owner approval', async () => {
    const draft = await create();
    expect((await http.get('/api/v1/workspace')).body.pieces).toHaveLength(0);
    await http.get(`/api/v1/pieces/${draft.entityId}`).expect(404);
    await http
      .get(`/api/v1/admin/revisions/${draft.id}/preview`)
      .auth(AGENT, { type: 'bearer' })
      .expect(409);
    const p = await preview(draft.id);
    expect(p.workspace.pieces).toHaveLength(1);
    await http
      .post(`/api/v1/admin/revisions/${draft.id}/approve`)
      .auth(AGENT, { type: 'bearer' })
      .send({ digest: p.digest, verified: true })
      .expect(403);
    await http
      .post(`/api/v1/admin/revisions/${draft.id}/publish`)
      .auth(AGENT, { type: 'bearer' })
      .send({ digest: p.digest })
      .expect(403);
    await http
      .post(`/api/v1/admin/revisions/${draft.id}/publish`)
      .auth(OWNER, { type: 'bearer' })
      .send({ digest: p.digest })
      .expect(409);
    await approve(draft.id, p.digest);
    await http
      .post(`/api/v1/admin/revisions/${draft.id}/publish`)
      .auth(OWNER, { type: 'bearer' })
      .send({ digest: p.digest })
      .expect(201);
    const live = (await http.get('/api/v1/workspace')).body as Workspace;
    expect(live.pieces[0].id).toBe(draft.entityId);
    expect(live.pieces[0].evidence).toEqual([]);
    expect(JSON.stringify(live)).not.toContain('PRIVATE REVIEW NOTE');
  });
  it('publishes public evidence while stripping its private review note', async () => {
    const content = makeContent('Public evidence');
    content.evidence[0].visibility = 'public';
    const r = await publish(await create(content));
    const live = (await http.get(`/api/v1/pieces/${r.entityId}`)).body;
    expect(live.evidence).toHaveLength(1);
    expect(live.evidence[0].note).toBe('');
  });
  it('prevents stale approval when the workspace changes', async () => {
    const a = await create(makeContent('Draft A'));
    const pa = await preview(a.id);
    await approve(a.id, pa.digest);
    await publish(await create(makeContent('Draft B')));
    await http
      .post(`/api/v1/admin/revisions/${a.id}/publish`)
      .auth(OWNER, { type: 'bearer' })
      .send({ digest: pa.digest })
      .expect(409);
    await publish(a);
  });
  it('preserves object identity and constituent relationships through updates and approved rollback', async () => {
    const child = await publish(await create(makeContent('Independent child')));
    const parentContent = {
      ...makeContent('Parent project'),
      kind: 'project' as const,
      relationships: [
        { targetId: child.entityId, type: 'contains' as const, note: 'A real constituent' },
      ],
    };
    const parent = await publish(await create(parentContent));
    const old = (await http.get('/api/v1/workspace')).body as Workspace;
    const edgeId = old.connections.find((e) => e.sourceId === parent.entityId)!.id;
    const edited = await create(
      { ...parentContent, title: 'Parent improved', position: { x: 1300, y: -200 } },
      parent.entityId,
      parent.id,
    );
    await publish(edited);
    const updated = (await http.get('/api/v1/workspace')).body as Workspace;
    expect(updated.pieces.find((p) => p.id === parent.entityId)?.title).toBe('Parent improved');
    expect(updated.connections.find((e) => e.sourceId === parent.entityId)?.id).toBe(edgeId);
    expect(updated.pieces.some((p) => p.id === child.entityId)).toBe(true);
    const rollback = (
      await http
        .post(`/api/v1/admin/revisions/${parent.id}/rollback`)
        .auth(AGENT, { type: 'bearer' })
        .send({})
        .expect(201)
    ).body as Revision;
    expect((await http.get(`/api/v1/pieces/${parent.entityId}`)).body.title).toBe(
      'Parent improved',
    );
    await publish(rollback);
    expect((await http.get(`/api/v1/pieces/${parent.entityId}`)).body.title).toBe('Parent project');
  });
  it('rejects graph cycles before publication', async () => {
    const a = await publish(await create(makeContent('Dependency A')));
    const b = await publish(
      await create({
        ...makeContent('Dependency B'),
        relationships: [{ targetId: a.entityId, type: 'depends_on', note: '' }],
      }),
    );
    const cyclic = await create(
      {
        ...(a.content as PieceContent),
        relationships: [{ targetId: b.entityId, type: 'reuses', note: '' }],
      },
      a.entityId,
      a.id,
    );
    const res = await http
      .post(`/api/v1/admin/revisions/${cyclic.id}/validate`)
      .auth(AGENT, { type: 'bearer' })
      .send({})
      .expect(400);
    expect(res.body.message).toContain('cycle');
  });
  it('rejects containment by fragments and missing relationship endpoints', async () => {
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({
        entityType: 'piece',
        content: {
          ...makeContent(),
          relationships: [{ targetId: randomUUID(), type: 'reuses', note: '' }],
        },
      })
      .expect(400);
    const child = await publish(await create(makeContent('Another child')));
    const invalid = await create({
      ...makeContent('Fragment cannot contain'),
      relationships: [{ targetId: child.entityId, type: 'contains', note: '' }],
    });
    await http
      .post(`/api/v1/admin/revisions/${invalid.id}/validate`)
      .auth(AGENT, { type: 'bearer' })
      .send({})
      .expect(400);
  });
  it('rejects an outdated base revision to prevent lost updates', async () => {
    const a = await publish(await create(makeContent('Concurrent target')));
    const b = await publish(
      await create({ ...(a.content as PieceContent), title: 'Changed' }, a.entityId, a.id),
    );
    expect(b.id).not.toBe(a.id);
    await http
      .post('/api/v1/admin/drafts')
      .auth(AGENT, { type: 'bearer' })
      .send({ entityType: 'piece', pieceId: a.entityId, baseRevisionId: a.id, content: a.content })
      .expect(409);
  });
  it('serializes concurrent publication so only one approved workspace snapshot wins', async () => {
    const a = await create(makeContent('Concurrent one'));
    const b = await create(makeContent('Concurrent two'));
    const pa = await preview(a.id),
      pb = await preview(b.id);
    await approve(a.id, pa.digest);
    await approve(b.id, pb.digest);
    const results = await Promise.all([
      http
        .post(`/api/v1/admin/revisions/${a.id}/publish`)
        .auth(OWNER, { type: 'bearer' })
        .send({ digest: pa.digest }),
      http
        .post(`/api/v1/admin/revisions/${b.id}/publish`)
        .auth(OWNER, { type: 'bearer' })
        .send({ digest: pb.digest }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it('applies the same approval workflow to profile and contact changes', async () => {
    const r = (
      await http
        .post('/api/v1/admin/drafts')
        .auth(AGENT, { type: 'bearer' })
        .send({
          entityType: 'profile',
          content: { ...defaultProfile, email: 'owner@example.com' },
          baseRevisionId: null,
        })
        .expect(201)
    ).body as Revision;
    expect((await http.get('/api/v1/profile')).body.email).toBe('');
    await publish(r);
    expect((await http.get('/api/v1/profile')).body.email).toBe('owner@example.com');
  });
  it('does not pretend to inspect repositories or infer achievements', async () => {
    const response = await http
      .post('/api/v1/admin/ingestions')
      .auth(AGENT, { type: 'bearer' })
      .send({
        title: 'My creation',
        summary: 'It adds two numbers.',
        repositoryUrl: 'https://github.com/example/repo',
        evidenceNote: 'I wrote and tested the add function.',
      })
      .expect(201);
    expect(response.body.inspectedRepository).toBe(false);
    expect(response.body.draft.content.technologies).toEqual([]);
    expect(response.body.draft.content.relationships).toEqual([]);
  });
  it('keeps approval audit access owner-only', async () => {
    await http.get('/api/v1/admin/audit').auth(AGENT, { type: 'bearer' }).expect(403);
    const r = await http.get('/api/v1/admin/audit').auth(OWNER, { type: 'bearer' }).expect(200);
    expect(r.body.some((e: { action: string }) => e.action === 'revision.published')).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain(OWNER);
  });
  it('runs with a database role that cannot rewrite evidence or create tables', async () => {
    if (pg) {
      await expect(pg.exec("UPDATE revision_evidence SET note='modified'")).rejects.toThrow();
      await expect(pg.exec('CREATE TABLE unexpected_table (id integer)')).rejects.toThrow();
    }
  });
  it('rate-limits the authentication endpoint', async () => {
    let status = 0;
    for (let i = 0; i < 11; i++)
      status = (await http.get('/api/v1/admin/session').auth('bad-token', { type: 'bearer' }))
        .status;
    expect(status).toBe(429);
  });
});
