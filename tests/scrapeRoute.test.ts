import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../app/api/scrape-recipe/route';

const post = (body: string) =>
  POST(new Request('http://localhost/api/scrape-recipe', { method: 'POST', headers: { 'content-type': 'application/json' }, body }));

describe('POST /api/scrape-recipe', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_AUTH_MOCK', 'true'));
  afterEach(() => vi.unstubAllEnvs());

  it('refuses requests from people who are not signed in', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_MOCK', 'false');
    const response = await post(JSON.stringify({ url: 'https://example.com/recipe' }));
    expect(response.status).toBe(401);
  });

  it('rejects an oversized body before importing anything', async () => {
    const response = await post(JSON.stringify({ url: `https://example.com/${'a'.repeat(5000)}` }));
    expect(response.status).toBe(413);
  });

  it('rejects a body that is not JSON', async () => {
    const response = await post('{not json');
    expect(response.status).toBe(400);
  });

  it('rejects a non-https URL with a readable message', async () => {
    const response = await post(JSON.stringify({ url: 'http://example.com/recipe' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Use a full https link, for example https://site.com/recipe.' });
  });

  it('refuses a local address', async () => {
    const response = await post(JSON.stringify({ url: 'https://127.0.0.1/recipe' }));
    expect(response.status).toBe(400);
  });

  it('refuses a local address written with markup characters', async () => {
    const response = await post(JSON.stringify({ url: 'https://127.0.0.1/<b>recipe</b>' }));
    expect(response.status).toBe(400);
  });
});
