import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
if (existsSync(`${root}/.git`)) {
  console.log('A Git repository already exists. It was not changed.');
  process.exit(0);
}
if (!existsSync(`${root}/git-history.bundle`))
  throw new Error(
    'git-history.bundle is missing. Use the delivered ZIP or initialize a new repository yourself.',
  );
function git(args) {
  const result = spawnSync('git', args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Git command failed: ${args[0]}`);
}
git(['init', '-b', 'restore-temporary']);
git(['bundle', 'verify', 'git-history.bundle']);
git(['fetch', 'git-history.bundle', 'refs/heads/*:refs/heads/*', 'refs/tags/*:refs/tags/*']);
git(['symbolic-ref', 'HEAD', 'refs/heads/dev']);
git(['reset', '--mixed']);
console.log(
  'Restored local main, dev, feature branches, tags, and commits. Working files were preserved. No remote is configured.',
);
