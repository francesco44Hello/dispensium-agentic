// PostToolUse (Write|Edit): lint the file that was just edited. Exit 2 feeds the errors back to Claude.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = String(input.tool_input?.file_path ?? '');
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

const inProject = filePath.startsWith(root) && !/\/(node_modules|\.next|\.claude)\//.test(filePath);
if (!inProject || !/\.(ts|tsx|js|jsx|mjs)$/.test(filePath)) process.exit(0);

try {
  execFileSync('npx', ['eslint', '--max-warnings', '0', filePath], { cwd: root, stdio: 'pipe' });
} catch (error) {
  const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
  console.error(`ESLint failed for ${filePath}:\n${out.split('\n').slice(0, 40).join('\n')}`);
  process.exit(2);
}
