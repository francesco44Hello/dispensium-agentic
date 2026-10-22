import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

// Balsamiq Sans only ships 400 and 700. Components must use the weight tokens, never a literal 500 or 600.
function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith('.module.css') ? [path] : [];
  });
}

describe('component font weights', () => {
  // Only the two weight tokens are allowed by name. A literal 400 or 700 is refused too: the token is the source of truth.
  it('uses only the title and brand tokens, never a literal 400, 500, 600 or 700', () => {
    const allowed = ['var(--font-weight-title)', 'var(--font-weight-brand)'];
    const offenders = cssFiles(join(process.cwd(), 'components')).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => {
          const declaration = /font-weight:\s*([^;]+);/.exec(line);
          return declaration !== null && !allowed.includes(declaration[1]?.trim() ?? '');
        })
        .map((line) => `${file}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
});
