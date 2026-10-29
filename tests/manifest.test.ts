import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import manifest from '../app/manifest';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

// The home screen icon comes from this manifest, so every icon it names must exist in public/.
describe('web app manifest', () => {
  const app = manifest();

  it('is the Dispensium app, opened standalone from the home screen', () => {
    expect(app.name).toBe('Dispensium');
    expect(app.short_name).toBe('Dispensium');
    expect(app.start_url).toBe('/');
    expect(app.display).toBe('standalone');
  });

  it('uses the app palette for the splash and the browser bar', () => {
    expect(app.background_color).toBe('#B7B1F2');
    expect(app.theme_color).toBe('#2D3C59');
  });

  it('lists 192 and 512 icons, and a maskable 512 icon for Android', () => {
    const icons = app.icons ?? [];
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({ src: '/icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' }),
      ]),
    );
  });

  it('points only at icon files that exist in public/', () => {
    for (const icon of app.icons ?? []) {
      expect(existsSync(`${publicDir}${icon.src}`)).toBe(true);
    }
  });
});
