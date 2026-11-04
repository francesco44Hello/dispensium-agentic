// Stop: if source files changed since the last green run, run typecheck + lint + unit tests.
// Blocks "done" (exit 2) while anything is red. Cheap on turns that changed no code.
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
// Already continuing because of this hook: let Claude stop rather than loop forever.
if (input.stop_hook_active) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const stamp = join(root, '.claude/.verify-stamp');
const watched = ['app', 'components', 'hooks', 'services', 'utils', 'types', 'constants', 'tests', 'e2e'];
const watchedFiles = ['firestore.rules', 'package.json', 'tsconfig.json', 'next.config.ts', 'vitest.config.js'];

const lastGreen = existsSync(stamp) ? statSync(stamp).mtimeMs : 0;

function newestChange(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestChange(full));
    else newest = Math.max(newest, statSync(full).mtimeMs);
  }
  return newest;
}

let changedAt = 0;
for (const dir of watched) if (existsSync(join(root, dir))) changedAt = Math.max(changedAt, newestChange(join(root, dir)));
for (const file of watchedFiles) if (existsSync(join(root, file))) changedAt = Math.max(changedAt, statSync(join(root, file)).mtimeMs);

if (changedAt <= lastGreen) process.exit(0);

for (const script of ['typecheck', 'lint', 'test']) {
  try {
    execSync(`npm run ${script}`, { cwd: root, stdio: 'pipe', encoding: 'utf8', timeout: 240_000 });
  } catch (error) {
    const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n').slice(-60).join('\n');
    console.error(`Not done: \`npm run ${script}\` is failing. Fix it before finishing.\n\n${out}`);
    process.exit(2);
  }
}
writeFileSync(stamp, String(Date.now()));
