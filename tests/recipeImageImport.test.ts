import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importImageFromUrl, type ImageResponse } from '../services/recipeImportService';
import { readCapped } from '../utils/readCapped';
import { POST } from '../app/api/recipe-image/route';

const image = (overrides: Partial<ImageResponse> = {}): ImageResponse => ({
  status: 200,
  contentType: 'image/jpeg',
  bytes: Buffer.from([1, 2, 3]),
  ...overrides,
});
const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];

describe('importImageFromUrl', () => {
  it('returns the bytes of a public jpeg, png or webp image', async () => {
    const fetchImage = vi.fn(async () => image());
    const result = await importImageFromUrl('https://example.com/cake.jpg', { fetchImage, lookup: publicLookup });
    expect(result.contentType).toBe('image/jpeg');
    expect(result.bytes).toEqual(Buffer.from([1, 2, 3]));
  });

  it('refuses a host that resolves to a private address, without fetching', async () => {
    const fetchImage = vi.fn(async () => image());
    const lookup = async () => [{ address: '192.168.1.1', family: 4 }];
    await expect(importImageFromUrl('https://example.com/a.jpg', { fetchImage, lookup })).rejects.toMatchObject({ code: 'blocked-address' });
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('refuses a response that is not an allowed image type', async () => {
    const fetchImage = vi.fn(async () => image({ contentType: 'text/html' }));
    await expect(importImageFromUrl('https://example.com/a', { fetchImage, lookup: publicLookup })).rejects.toMatchObject({ code: 'not-an-image' });
  });

  it('does not follow redirects for images, and reports a failed fetch', async () => {
    const fetchImage = vi.fn(async () => image({ status: 302, location: 'https://example.com/b.jpg' }));
    await expect(importImageFromUrl('https://example.com/a.jpg', { fetchImage, lookup: publicLookup })).rejects.toMatchObject({ code: 'fetch-failed' });
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });
});

describe('readCapped', () => {
  const streamOf = (chunks: string[]) =>
    new Request('http://localhost/x', { method: 'POST', body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }), duplex: 'half' } as RequestInit & { duplex: 'half' });

  it('returns the whole body when it is within the limit', async () => {
    expect(await readCapped(streamOf(['abc', 'def']), 10)).toBe('abcdef');
  });

  it('returns null as soon as the body passes the limit', async () => {
    expect(await readCapped(streamOf(['abcdef', 'ghijkl']), 8)).toBeNull();
  });
});

describe('POST /api/recipe-image', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_AUTH_MOCK', 'true'));
  afterEach(() => vi.unstubAllEnvs());

  it('refuses requests from people who are not signed in', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_MOCK', 'false');
    const response = await POST(new Request('http://localhost/api/recipe-image', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(401);
  });

  const post = (body: string) =>
    POST(new Request('http://localhost/api/recipe-image', { method: 'POST', headers: { 'content-type': 'application/json' }, body }));

  it('refuses a non-https or local address', async () => {
    expect((await post(JSON.stringify({ url: 'http://example.com/a.jpg' }))).status).toBe(400);
    expect((await post(JSON.stringify({ url: 'https://127.0.0.1/a.jpg' }))).status).toBe(400);
  });

  it('refuses a body that is too large or not JSON', async () => {
    expect((await post(JSON.stringify({ url: `https://example.com/${'a'.repeat(5000)}` }))).status).toBe(413);
    expect((await post('{not json')).status).toBe(400);
  });
});
