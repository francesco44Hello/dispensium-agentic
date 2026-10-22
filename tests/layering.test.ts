import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

// utils/ and types/ are shared and must not depend on the layers that use them.
// constants/ is pure data and is allowed.
// Both relative (../services/x) and alias (@/services/x) imports are checked.
const FORBIDDEN = /from\s+['"](?:(?:\.\.\/)+|@\/)(?:services|components|hooks|app)\//;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [path] : [];
  });
}

describe('layering', () => {
  it('utils and types never import from services, components, hooks or app', () => {
    const offenders = ['utils', 'types'].flatMap((dir) =>
      sourceFiles(join(process.cwd(), dir)).flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .filter((line) => FORBIDDEN.test(line))
          .map((line) => `${file}: ${line.trim()}`),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
