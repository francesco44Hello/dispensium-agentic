import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// PNG colour type 2 is RGB (no alpha); 6 is RGBA.
const PNG_COLOR_TYPE_RGB = 2;

// iOS draws any alpha channel as black on the home screen, so the apple touch icon must be plain RGB.
const iconPath = fileURLToPath(new URL('../public/icons/apple-touch-icon-v2.png', import.meta.url));

describe('apple touch icon', () => {
  it('is a plain RGB PNG with no alpha channel', () => {
    const header = readFileSync(iconPath);
    expect(header[25]).toBe(PNG_COLOR_TYPE_RGB);
  });
});
