import { describe, it, expect, vi } from 'vitest';
import { isPublicAddress } from '../utils/isPublicAddress';
import { parseImportUrl } from '../utils/importUrl';
import { extractRecipe } from '../utils/recipeJsonLd';
import { isExtractedRecipe } from '../utils/isExtractedRecipe';
import { createPinnedLookup, importRecipeFromUrl, RecipeImportError, type PageResponse } from '../services/recipeImportService';

describe('isPublicAddress', () => {
  it('accepts ordinary public addresses', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('93.184.216.34')).toBe(true);
    expect(isPublicAddress('172.32.0.1')).toBe(true);
    expect(isPublicAddress('2606:4700::1111')).toBe(true);
    expect(isPublicAddress('::ffff:8.8.8.8')).toBe(true);
  });

  it('rejects loopback, private, link-local, shared and reserved IPv4 addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '240.0.0.1']) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });

  it('rejects loopback, unspecified, unique-local, link-local and mapped private IPv6 addresses', () => {
    for (const ip of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', '2001:0:4136:e378:8000:63bf:3fff:fdd2', '2001::1', '100::1']) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });

  it('rejects IPv6 forms that embed a private IPv4 address', () => {
    for (const ip of ['::7f00:1', '::a00:1', '64:ff9b::7f00:1', '2002:7f00:1::1', '::ffff:7f00:1']) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });

  it('rejects anything it cannot parse', () => {
    expect(isPublicAddress('not-an-ip')).toBe(false);
  });
});

describe('parseImportUrl', () => {
  it('accepts a plain https URL on the default port', () => {
    expect(parseImportUrl('https://example.com/recipe').hostname).toBe('example.com');
  });

  it('rejects non-https schemes, credentials and non-default ports', () => {
    for (const url of ['http://example.com', 'ftp://example.com/x', 'https://user:pw@example.com', 'https://example.com:8443/x']) {
      expect(() => parseImportUrl(url), url).toThrow(RecipeImportError);
    }
  });

  it('rejects localhost names and private or local IP literals', () => {
    for (const url of ['https://localhost/x', 'https://intranet.localhost/x', 'https://127.0.0.1/', 'https://[::1]/', 'https://169.254.169.254/latest']) {
      expect(() => parseImportUrl(url), url).toThrow(RecipeImportError);
    }
  });

  it('rejects text that is not a URL, and over-long input', () => {
    expect(() => parseImportUrl('not a url')).toThrow(RecipeImportError);
    expect(() => parseImportUrl(`https://example.com/${'a'.repeat(2100)}`)).toThrow(RecipeImportError);
  });
});

describe('createPinnedLookup', () => {
  // Node calls this at connect time, and the address it returns is the one the socket uses.
  // Checking here, instead of before the request, closes the DNS rebinding gap.
  const lookupWith = (addresses: { address: string; family: number }[]) =>
    createPinnedLookup(async () => addresses);

  const resolve = (lookup: ReturnType<typeof createPinnedLookup>, options: object) =>
    new Promise<{ err: Error | null; address?: unknown; family?: number }>((done) => {
      lookup('example.com', options, (err: Error | null, address?: unknown, family?: number) => done({ err, address, family }));
    });

  it('hands the socket a public address', async () => {
    const result = await resolve(lookupWith([{ address: '93.184.216.34', family: 4 }]), {});
    expect(result.err).toBeNull();
    expect(result.address).toBe('93.184.216.34');
    expect(result.family).toBe(4);
  });

  it('refuses a name that resolves to any private address', async () => {
    const result = await resolve(lookupWith([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.5', family: 4 }]), {});
    expect(result.err).toBeInstanceOf(RecipeImportError);
  });

  it('returns the full list when the socket asks for all addresses', async () => {
    const result = await resolve(lookupWith([{ address: '93.184.216.34', family: 4 }]), { all: true });
    expect(result.address).toEqual([{ address: '93.184.216.34', family: 4 }]);
  });
});

describe('extractRecipe', () => {
  const page = (json: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;

  it('reads title, ingredients, steps and image from a Recipe block', () => {
    const html = page({
      '@type': 'Recipe',
      name: 'Carbonara',
      recipeIngredient: ['spaghetti', 'eggs'],
      recipeInstructions: [{ '@type': 'HowToStep', text: 'Boil pasta' }, 'Mix eggs'],
      image: 'https://example.com/c.jpg',
    });
    expect(extractRecipe(html)).toEqual({
      title: 'Carbonara',
      ingredients: ['spaghetti', 'eggs'],
      steps: ['Boil pasta', 'Mix eggs'],
      image: 'https://example.com/c.jpg',
    });
  });

  it('finds a Recipe inside @graph and with an array @type', () => {
    const html = page({
      '@graph': [
        { '@type': 'WebSite', name: 'Blog' },
        { '@type': ['Thing', 'Recipe'], name: 'Soup', recipeIngredient: ['water'], recipeInstructions: 'Boil' },
      ],
    });
    expect(extractRecipe(html)?.title).toBe('Soup');
    expect(extractRecipe(html)?.steps).toEqual(['Boil']);
  });

  it('flattens how-to sections into steps and reads image arrays and objects', () => {
    const html = page({
      '@type': 'Recipe',
      name: 'Cake',
      recipeInstructions: [{ '@type': 'HowToSection', itemListElement: [{ text: 'Whisk' }, { text: 'Bake' }] }],
      image: [{ url: 'https://example.com/cake.jpg' }],
    });
    expect(extractRecipe(html)?.steps).toEqual(['Whisk', 'Bake']);
    expect(extractRecipe(html)?.image).toBe('https://example.com/cake.jpg');
  });

  it('keeps only https cover images, so a plain http image is dropped', () => {
    const html = page({ '@type': 'Recipe', name: 'Tea', image: 'http://example.com/tea.jpg' });
    expect(extractRecipe(html)?.image).toBe('');
  });

  it('skips malformed JSON-LD blocks and still finds a valid one', () => {
    const html = `<script type="application/ld+json">{ broken</script>${page({ '@type': 'Recipe', name: 'Tea', recipeIngredient: [] })}`;
    expect(extractRecipe(html)?.title).toBe('Tea');
  });

  it('accepts single-quoted and extra attributes on the script tag', () => {
    const html = `<script async defer type='application/ld+json'>${JSON.stringify({ '@type': 'Recipe', name: 'Tea' })}</script>`;
    expect(extractRecipe(html)?.title).toBe('Tea');
  });

  it('returns null when the page has no recipe data', () => {
    expect(extractRecipe('<html><body>Hello</body></html>')).toBeNull();
    expect(extractRecipe(page({ '@type': 'Organization', name: 'Acme' }))).toBeNull();
  });

  it('stays fast on a page with thousands of unclosed script tags', () => {
    const hostile = '<script type="application/ld+json">'.repeat(60_000);
    const started = Date.now();
    expect(extractRecipe(hostile)).toBeNull();
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('isExtractedRecipe', () => {
  it('accepts the expected shape and rejects anything else', () => {
    expect(isExtractedRecipe({ title: 'Soup', ingredients: ['water'], steps: ['Boil'], image: '' })).toBe(true);
    expect(isExtractedRecipe({ title: 'Soup', ingredients: 'water', steps: [], image: '' })).toBe(false);
    expect(isExtractedRecipe({ error: 'nope' })).toBe(false);
    expect(isExtractedRecipe(null)).toBe(false);
  });
});

const pageOf = (body: string): PageResponse => ({ status: 200, body });
const recipePage = pageOf(
  `<script type="application/ld+json">${JSON.stringify({ '@type': 'Recipe', name: 'Soup', recipeIngredient: ['water'], recipeInstructions: ['Boil'] })}</script>`,
);
const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

describe('importRecipeFromUrl', () => {
  it('returns the extracted recipe for a public page', async () => {
    const fetchPage = vi.fn(async () => recipePage);
    const result = await importRecipeFromUrl('https://example.com/soup', { fetchPage, lookup: publicLookup });
    expect(result.title).toBe('Soup');
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('blocks a host whose name resolves to a private address, without fetching it', async () => {
    const fetchPage = vi.fn(async () => recipePage);
    const lookup = async () => [{ address: '10.0.0.5', family: 4 }];
    await expect(importRecipeFromUrl('https://rebind.example.com/', { fetchPage, lookup })).rejects.toMatchObject({ code: 'blocked-address' });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('checks every redirect hop, so a redirect to a private host is blocked', async () => {
    const fetchPage = vi.fn(async (url: URL): Promise<PageResponse> =>
      url.hostname === 'example.com' ? { status: 302, location: 'https://internal.example.net/admin', body: '' } : recipePage,
    );
    const lookup = async (host: string) => (host === 'internal.example.net' ? [{ address: '192.168.0.10', family: 4 }] : [{ address: '93.184.216.34', family: 4 }]);
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage, lookup })).rejects.toMatchObject({ code: 'blocked-address' });
  });

  it('refuses a redirect location that contains blocked characters', async () => {
    const fetchPage = vi.fn(async (): Promise<PageResponse> => ({ status: 302, location: 'https://example.com/<a>', body: '' }));
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage, lookup: publicLookup })).rejects.toMatchObject({ code: 'fetch-failed' });
  });

  it('treats a malformed redirect location as a failed fetch', async () => {
    const fetchPage = vi.fn(async (): Promise<PageResponse> => ({ status: 302, location: 'https://[bad', body: '' }));
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage, lookup: publicLookup })).rejects.toMatchObject({ code: 'fetch-failed' });
  });

  it('gives up after too many redirects', async () => {
    const fetchPage = vi.fn(async (): Promise<PageResponse> => ({ status: 302, location: 'https://example.com/again', body: '' }));
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage, lookup: publicLookup })).rejects.toMatchObject({ code: 'too-many-redirects' });
  });

  it('reports a failed fetch and a page without a recipe', async () => {
    const failing = vi.fn(async () => ({ status: 500, body: '' }));
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage: failing, lookup: publicLookup })).rejects.toMatchObject({ code: 'fetch-failed' });

    const plain = vi.fn(async () => pageOf('<html>no recipe</html>'));
    await expect(importRecipeFromUrl('https://example.com/a', { fetchPage: plain, lookup: publicLookup })).rejects.toMatchObject({ code: 'no-recipe' });
  });
});
