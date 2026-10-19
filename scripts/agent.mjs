import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch {
  /* An external agent may provide environment variables instead. */
}
const [command, argument] = process.argv.slice(2);
if (!command || command === 'help') {
  console.log(
    'Commands: npm run agent -- list | prepare <ingestion.json> | draft <draft.json> | validate <revision-id> | preview <revision-id>',
  );
  console.log(
    'Uses AGENT_TOKEN only. Approval and publication are deliberately available only in the owner studio/API.',
  );
  process.exit(0);
}
if (!['list', 'prepare', 'draft', 'validate', 'preview'].includes(command))
  throw new Error('Unknown command. Run npm run agent -- help.');
if (!process.env.AGENT_TOKEN)
  throw new Error(
    'Set AGENT_TOKEN or run npm run setup. Never paste credentials into source files.',
  );
const base = process.env.BLUEPRINT_API_URL ?? 'http://localhost:3001/api/v1';
const parsedBase = new URL(base);
if (parsedBase.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsedBase.hostname))
  throw new Error('Remote API access requires HTTPS.');
if (['validate', 'preview'].includes(command) && !argument?.match(/^[0-9a-f-]{36}$/i))
  throw new Error('A revision UUID is required.');
let path = '/admin/revisions',
  method = 'GET',
  body;
if (['prepare', 'draft'].includes(command)) {
  if (!argument) throw new Error('Provide the path to a JSON file.');
  body = JSON.parse(await readFile(argument, 'utf8'));
  path = command === 'prepare' ? '/admin/ingestions' : '/admin/drafts';
  method = 'POST';
}
if (command === 'validate') {
  path = `/admin/revisions/${argument}/validate`;
  method = 'POST';
  body = {};
}
if (command === 'preview') path = `/admin/revisions/${argument}/preview`;
const response = await fetch(`${base}${path}`, {
  method,
  headers: {
    Authorization: `Bearer ${process.env.AGENT_TOKEN}`,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  },
  body: body ? JSON.stringify(body) : undefined,
});
const result = await response.json();
if (!response.ok) {
  console.error(result.message ?? `API request failed (${response.status})`);
  if (result.issues) console.error(JSON.stringify(result.issues, null, 2));
  process.exit(1);
}
if (command === 'prepare' || command === 'preview') {
  const directory = fileURLToPath(new URL('../.local/', import.meta.url));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const file = `${directory}/${command}-${Date.now()}.json`;
  await writeFile(file, JSON.stringify(command === 'prepare' ? result.draft : result, null, 2), {
    mode: 0o600,
  });
  console.log(`Saved private ${command} to ${file}`);
  if (result.reviewNotes) console.log(result.reviewNotes.join('\n'));
  if (command === 'preview')
    console.log(
      'Open http://localhost:5173/#manage as owner to inspect and approve this exact revision. Nothing has been published.',
    );
} else if (command === 'draft')
  console.log(
    JSON.stringify(
      { revisionId: result.id, pieceId: result.entityId, status: result.status },
      null,
      2,
    ),
  );
else if (command === 'list')
  console.log(
    JSON.stringify(
      result.revisions.map((r) => ({
        id: r.id,
        entityId: r.entityId,
        title: r.content.title ?? r.content.name,
        status: r.status,
      })),
      null,
      2,
    ),
  );
else console.log(JSON.stringify(result, null, 2));
