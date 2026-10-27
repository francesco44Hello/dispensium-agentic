import { createVerify } from 'node:crypto';
import { isRecord } from './isRecord';

// Checks a Firebase ID token (a signed JWT) without the admin SDK: the signature, the issuer, the audience,
// the expiry and the user id. getKey maps a key id to the PEM certificate or public key that signed the token.
interface VerifyOptions {
  projectId: string;
  getKey: (kid: string) => Promise<string | undefined>;
  now?: number;
}

const decodeSegment = (segment: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  if (!isRecord(value)) throw new Error('invalid token segment');
  return value;
};

export async function verifyIdToken(token: string, options: VerifyOptions): Promise<string> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [headerPart, payloadPart, signaturePart] = parts;

  const header = decodeSegment(headerPart);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error('unsupported token header');

  const key = await options.getKey(header.kid);
  if (!key) throw new Error('unknown signing key');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${headerPart}.${payloadPart}`);
  if (!verifier.verify(key, Buffer.from(signaturePart, 'base64url'))) throw new Error('bad signature');

  const payload = decodeSegment(payloadPart);
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (payload.aud !== options.projectId) throw new Error('token is for another project');
  if (payload.iss !== `https://securetoken.google.com/${options.projectId}`) throw new Error('wrong issuer');
  if (typeof payload.exp !== 'number' || payload.exp <= now) throw new Error('token expired');
  if (typeof payload.iat !== 'number' || payload.iat > now + 300) throw new Error('token issued in the future');
  if (typeof payload.sub !== 'string' || payload.sub === '') throw new Error('token has no user id');
  return payload.sub;
}
