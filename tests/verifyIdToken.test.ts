import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { verifyIdToken } from '../utils/verifyIdToken';

const PROJECT = 'dispensium-test';
const NOW = 1_800_000_000;
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const getKey = async (kid: string) => (kid === 'key-1' ? publicPem : undefined);

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

function tokenWith(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: 'RS256', kid: 'key-1' }) {
  const payload = {
    aud: PROJECT,
    iss: `https://securetoken.google.com/${PROJECT}`,
    sub: 'user-42',
    iat: NOW - 10,
    exp: NOW + 3600,
    ...claims,
  };
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

const verify = (token: string) => verifyIdToken(token, { projectId: PROJECT, getKey, now: NOW });

describe('verifyIdToken', () => {
  it('returns the user id for a valid token from this project', async () => {
    expect(await verify(tokenWith({}))).toBe('user-42');
  });

  it('refuses a token issued for another project', async () => {
    await expect(verify(tokenWith({ aud: 'someone-else' }))).rejects.toThrow();
    await expect(verify(tokenWith({ iss: 'https://securetoken.google.com/someone-else' }))).rejects.toThrow();
  });

  it('refuses an expired token and a token issued in the future', async () => {
    await expect(verify(tokenWith({ exp: NOW - 1 }))).rejects.toThrow();
    await expect(verify(tokenWith({ iat: NOW + 3600 }))).rejects.toThrow();
  });

  it('refuses a token whose payload was changed after signing', async () => {
    const [header, , signature] = tokenWith({}).split('.');
    const forged = `${header}.${b64({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: 'admin', iat: NOW, exp: NOW + 3600 })}.${signature}`;
    await expect(verify(forged)).rejects.toThrow();
  });

  it('refuses an unknown key id and an algorithm other than RS256', async () => {
    await expect(verify(tokenWith({}, { alg: 'RS256', kid: 'unknown' }))).rejects.toThrow();
    await expect(verify(tokenWith({}, { alg: 'none', kid: 'key-1' }))).rejects.toThrow();
  });

  it('refuses a token without a user id', async () => {
    await expect(verify(tokenWith({ sub: '' }))).rejects.toThrow();
  });
});
