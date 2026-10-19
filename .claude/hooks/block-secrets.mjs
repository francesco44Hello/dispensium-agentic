// PreToolUse (Write|Edit): refuse to touch secret files. Exit 2 = block, stderr is shown to Claude.
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = String(input.tool_input?.file_path ?? '');
const base = filePath.split('/').pop() ?? '';

const isEnvFile = /^\.env(\..+)?$/.test(base) && base !== '.env.example';
const isServiceAccount = /adminsdk.*\.json$/i.test(base);

if (isEnvFile || isServiceAccount) {
  console.error(`Blocked: ${base} holds secrets. Ask the user to edit it; never write secrets from an agent.`);
  process.exit(2);
}
