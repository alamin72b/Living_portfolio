type Query = (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
/** Called by the migrator, never by the web-facing application. */
export async function provisionAppRole(query: Query, user: string, password: string) {
  const current = (await query('SELECT current_user AS current_user')).rows[0];
  if (current.current_user === user)
    throw new Error('The application role must differ from the migration role.');
  const q = (
    await query(
      'SELECT quote_ident($1) AS role, quote_literal($2) AS password, quote_ident(current_database()) AS database',
      [user, password],
    )
  ).rows[0];
  const existing = await query('SELECT 1 FROM pg_roles WHERE rolname=$1', [user]);
  await query(
    `${existing.rows.length ? 'ALTER' : 'CREATE'} ROLE ${q.role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${q.password}`,
  );
  await query(`GRANT CONNECT ON DATABASE ${q.database} TO ${q.role}`);
  await query(`GRANT USAGE ON SCHEMA public TO ${q.role}`);
  await query(
    `GRANT SELECT, INSERT ON revision_evidence, revision_media, revision_relationships, revision_layouts, audit_events TO ${q.role}`,
  );
  await query(`GRANT SELECT, INSERT, UPDATE ON revisions, pieces, layouts TO ${q.role}`);
  await query(`GRANT SELECT, UPDATE ON site_state TO ${q.role}`);
  await query(`GRANT SELECT, INSERT, DELETE ON connections TO ${q.role}`);
  await query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${q.role}`);
}
