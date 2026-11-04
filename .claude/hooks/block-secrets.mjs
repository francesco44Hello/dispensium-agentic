// PreToolUse (Write|Edit|MultiEdit|NotebookEdit): refuse to touch secret files. Exit 2 = block, stderr is shown to Claude.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  console.error('Blocked: unreadable hook payload. Retry the edit.');
  process.exit(2);
}
// NotebookEdit sends notebook_path instead of file_path.
const rawPath = String(input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? '');
const filePath = posix.normalize(rawPath);
const base = filePath.split('/').pop() ?? '';

const isEnvFile = /^\.env(\..+)?$/.test(base) && base !== '.env.example';
const isServiceAccount = /adminsdk.*\.json$/i.test(base);

if (isEnvFile || isServiceAccount) {
  console.error(`Blocked: ${base} holds secrets. Ask the user to edit it; never write secrets from an agent.`);
  process.exit(2);
}

