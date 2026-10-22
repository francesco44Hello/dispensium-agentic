import { describe, it, expect, vi } from 'vitest';
import { createKeyCache } from '../services/requestAuth';
import { KeysUnavailableError } from '../utils/requestAuthErrors';
import { extractRecipe } from '../utils/recipeJsonLd';

describe('createKeyCache', () => {
  it('serves a known key without fetching again', async () => {
    const fetchKeys = vi.fn(async () => ({ keys: { 'key-1': 'pem-1' }, maxAgeSeconds: 3600 }));
    const keys = createKeyCache(fetchKeys, () => 0);
    expect(await keys('key-1')).toBe('pem-1');
    expect(await keys('key-1')).toBe('pem-1');
    expect(fetchKeys).toHaveBeenCalledTimes(1);
  });

  it('refetches for a new key id, but at most once a minute, so random ids cannot hammer Google', async () => {
    let published: Record<string, string> = { 'key-1': 'pem-1' };
    const fetchKeys = vi.fn(async () => ({ keys: published, maxAgeSeconds: 3600 }));
    let clock = 0;
    const keys = createKeyCache(fetchKeys, () => clock);
    await keys('key-1');
    published = { 'key-1': 'pem-1', 'key-2': 'pem-2' };
    expect(await keys('key-2')).toBeUndefined();
    clock = 120_000;
    expect(await keys('key-2')).toBe('pem-2');
    expect(fetchKeys).toHaveBeenCalledTimes(2);
  });

  it('does not treat object prototype names as keys', async () => {
    const keys = createKeyCache(async () => ({ keys: { 'key-1': 'pem-1' }, maxAgeSeconds: 3600 }), () => 0);
    expect(await keys('constructor')).toBeUndefined();
    expect(await keys('__proto__')).toBeUndefined();
  });
});

describe('createKeyCache under concurrency and failure', () => {
  it('fetches once for many concurrent requests that need the keys', async () => {
    const fetchKeys = vi.fn(async () => ({ keys: { 'key-1': 'pem-1' }, maxAgeSeconds: 3600 }));
    const keys = createKeyCache(fetchKeys, () => 0);
    const results = await Promise.all(Array.from({ length: 20 }, () => keys('key-1')));
    expect(results.every((pem) => pem === 'pem-1')).toBe(true);
    expect(fetchKeys).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable keys when Google cannot be reached, and does not retry on every request', async () => {
    const fetchKeys = vi.fn(async (): Promise<{ keys: Record<string, string>; maxAgeSeconds: number }> => {
      throw new Error('network down');
    });
    const keys = createKeyCache(fetchKeys, () => 0);
    await expect(keys('key-1')).rejects.toBeInstanceOf(KeysUnavailableError);
    await expect(keys('key-1')).rejects.toBeInstanceOf(KeysUnavailableError);
    expect(fetchKeys).toHaveBeenCalledTimes(1);
  });
});

describe('extractRecipe depth limit', () => {
  it('returns null for absurdly nested JSON-LD instead of crashing', () => {
    const nested = '{"@graph":'.repeat(5000) + '{}' + '}'.repeat(5000);
    const html = `<script type="application/ld+json">${nested}</script>`;
    expect(extractRecipe(html)).toBeNull();
  });
});

describe('imageUrl depth limit', () => {
  it('returns no image for a deeply nested image array instead of crashing', () => {
    const nested = '{"@type":"Recipe","name":"x","image":' + '['.repeat(5000) + ']'.repeat(5000) + '}';
    const html = `<script type="application/ld+json">${nested}</script>`;
    expect(extractRecipe(html)?.image).toBe('');
  });
});

