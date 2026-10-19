import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const file = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(file)) {
  console.log('.env already exists; no changes made.');
} else {
  const password = randomBytes(24).toString('hex');
  const appPassword = randomBytes(24).toString('hex');
  const text = readFileSync(new URL('../.env.example', import.meta.url), 'utf8')
    .replaceAll('REPLACE_ME', password)
    .replaceAll('REPLACE_APP_PASSWORD', appPassword)
    .replace('REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS', randomBytes(32).toString('hex'))
    .replace('REPLACE_WITH_A_DIFFERENT_RANDOM_VALUE', randomBytes(32).toString('hex'));
  writeFileSync(file, text, { mode: 0o600 });
  console.log('Created .env with unique local credentials. Keep it private.');
}
