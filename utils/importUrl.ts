import { isPublicAddress } from './isPublicAddress';
import { RecipeImportError } from './recipeImportError';

const MAX_URL_LENGTH = 2048;

// Accepts only plain https URLs on the default port, with no credentials, no localhost names and no private IP literals.
export function parseImportUrl(raw: string): URL {
  const value = raw.trim();
  if (value.length > MAX_URL_LENGTH) throw new RecipeImportError('invalid-url');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new RecipeImportError('invalid-url');
  }

  if (url.protocol !== 'https:') throw new RecipeImportError('invalid-url');
  if (url.username || url.password) throw new RecipeImportError('invalid-url');
  if (url.port !== '') throw new RecipeImportError('invalid-url');

  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost')) throw new RecipeImportError('invalid-url');
  if (isIpLiteral(host) && !isPublicAddress(host)) throw new RecipeImportError('invalid-url');

  return url;
}

export function isIpLiteral(host: string): boolean {
  return host.includes(':') || /^[\d.]+$/.test(host);
}
