import { fileURLToPath } from 'node:url';
import { eq, sql } from 'drizzle-orm';
import { sampleWorkspace, type PieceContent } from '@blueprint/shared';
import { createApplication } from '../app.js';
import { Database } from './database.js';
import { revisions } from './schema.js';
import { PortfolioService } from '../portfolio/portfolio.service.js';
export async function seed() {
  const { app } = await createApplication();
  try {
    const db = app.get(Database);
    const existing = await db.orm
      .select({ id: revisions.id })
      .from(revisions)
      .where(eq(sql<string>`${revisions.body}->>'attribution'`, 'neutral-demo'))
      .limit(1);
    if (existing.length) {
      console.log('Neutral draft samples already exist; no changes made.');
      return;
    }
    const service = app.get(PortfolioService);
    for (const piece of sampleWorkspace.pieces) {
      const {
        id: _id,
        revisionId: _revisionId,
        revisionNumber: _revisionNumber,
        ...content
      } = piece;
      await service.createDraft(
        { entityType: 'piece', baseRevisionId: null, content: content as PieceContent },
        'agent',
      );
    }
    console.log(
      'Created four neutral demonstration drafts. Nothing was published. The interactive sample graph is bundled separately in the frontend.',
    );
  } finally {
    await app.close();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  seed().catch(() => {
    console.error('Seed failed. Check that migrations and environment setup are complete.');
    process.exitCode = 1;
  });
