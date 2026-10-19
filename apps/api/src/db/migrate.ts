import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import '../config.js';
import { provisionAppRole } from './provision.js';
import { z } from '@blueprint/shared';
export async function migrate() {
  const configuration = z
    .object({
      DATABASE_URL: z.string().startsWith('postgres'),
      MIGRATION_DATABASE_URL: z.string().startsWith('postgres').optional(),
      APP_DATABASE_USER: z
        .string()
        .regex(/^[a-z_][a-z0-9_]{0,62}$/)
        .optional(),
      APP_DATABASE_PASSWORD: z.string().min(24).optional(),
    })
    .parse(process.env);
  if (Boolean(configuration.APP_DATABASE_USER) !== Boolean(configuration.APP_DATABASE_PASSWORD))
    throw new Error('Supply both application database role variables.');
  const pool = new Pool({
    connectionString: configuration.MIGRATION_DATABASE_URL ?? configuration.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(817264)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const directory = fileURLToPath(new URL('../../migrations/', import.meta.url));
    const files = (await readdir(directory)).filter((f) => f.endsWith('.sql')).sort();
    for (const name of files) {
      const sql = await readFile(`${directory}/${name}`, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const found = await client.query<{ checksum: string }>(
        'SELECT checksum FROM schema_migrations WHERE name=$1',
        [name],
      );
      if (found.rows.length) {
        if (found.rows[0].checksum !== checksum)
          throw new Error(
            `Migration ${name} changed after application. Create a new migration instead.`,
          );
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [
          name,
          checksum,
        ]);
        await client.query('COMMIT');
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    if (configuration.APP_DATABASE_USER && configuration.APP_DATABASE_PASSWORD) {
      await provisionAppRole(
        (text, values) => client.query(text, values),
        configuration.APP_DATABASE_USER,
        configuration.APP_DATABASE_PASSWORD,
      );
      console.log('Application database role provisioned with limited data permissions.');
    }
    console.log('Database migrations are up to date.');
  } finally {
    await client.query('SELECT pg_advisory_unlock(817264)');
    client.release();
    await pool.end();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  migrate().catch(() => {
    console.error(
      'Migration failed. Check connectivity, credentials, migration checksum, and database permissions. No credentials were logged.',
    );
    process.exitCode = 1;
  });
