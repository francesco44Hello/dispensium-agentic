import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import { isPublicAddress } from '../utils/isPublicAddress';
import { sanitizeInput } from '../utils/sanitizeInput';
import { isIpLiteral, parseImportUrl } from '../utils/importUrl';
import { RecipeImportError } from '../utils/recipeImportError';
import { extractRecipe } from '../utils/recipeJsonLd';
import { isAllowedImageType } from '../utils/recipeImage';
import type { ExtractedRecipe } from '../types/recipe';

const MAX_REDIRECTS = 3;
const MAX_PAGE_BYTES = 2 * 1024 * 1024;
// Source photos can be larger than what we store; the browser compresses them before upload.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;

export interface PageResponse {
  status: number;
  location?: string;
  body: string;
}

export interface ImageResponse {
  status: number;
  location?: string;
  contentType: string;
  bytes: Buffer;
}

interface ImportDeps {
  fetchPage: (url: URL) => Promise<PageResponse>;
  lookup: (host: string) => Promise<{ address: string }[]>;
}

interface ImageImportDeps {
  fetchImage: (url: URL) => Promise<ImageResponse>;
  lookup: (host: string) => Promise<{ address: string }[]>;
}

// True when the list is empty or any address is not public, so the whole name is refused.
function hasNonPublicAddress(addresses: { address: string }[]): boolean {
  return addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address));
}

type LookupCallback = (error: Error | null, address: string | LookupAddress[], family: number) => void;

// Node calls this lookup when it connects, and the address it returns is the one the socket uses.
// Refusing a name whose addresses include any private one closes the gap between checking and connecting (DNS rebinding).
export function createPinnedLookup(resolve: (host: string) => Promise<LookupAddress[]>) {
  return (hostname: string, options: LookupOptions, callback: LookupCallback) => {
    const wantsAll = options.all === true;
    resolve(hostname).then(
      (addresses) => {
        if (hasNonPublicAddress(addresses)) {
          callback(new RecipeImportError('blocked-address'), '', 0);
          return;
        }
        if (wantsAll) callback(null, addresses, 0);
        else callback(null, addresses[0].address, addresses[0].family);
      },
      () => callback(new RecipeImportError('fetch-failed'), '', 0),
    );
  };
}

const resolveHost = (host: string): Promise<LookupAddress[]> =>
  new Promise((resolve, reject) => {
    dnsLookup(host, { all: true }, (error, addresses) => (error ? reject(error) : resolve(addresses)));
  });

interface NetworkResponse {
  status: number;
  location?: string;
  contentType: string;
  bytes: Buffer;
}

// Real network transport. Plain GET with no compression, the body capped while it streams, every connection through the pinned lookup.
// Redirect bodies are not read. The whole request has a deadline, because idle timeouts reset on every byte.
function requestOverNetwork(url: URL, maxBytes: number): Promise<NetworkResponse> {
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => req.destroy(new RecipeImportError('fetch-failed')), TIMEOUT_MS);
    const req = httpsRequest(
      url,
      {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'identity' },
        lookup: createPinnedLookup(resolveHost),
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = res.headers['content-type'] ?? '';
        if (status >= 300 && status < 400) {
          res.resume();
          resolve({ status, location: res.headers.location, contentType, bytes: Buffer.alloc(0) });
          return;
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy();
            reject(new RecipeImportError('too-large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ status, contentType, bytes: Buffer.concat(chunks) }));
        res.on('error', () => reject(new RecipeImportError('fetch-failed')));
      },
    );
    req.on('timeout', () => req.destroy(new RecipeImportError('fetch-failed')));
    req.on('close', () => clearTimeout(deadline));
    req.on('error', (error) => reject(error instanceof RecipeImportError ? error : new RecipeImportError('fetch-failed')));
    req.end();
  });
}

const fetchPageOverNetwork = async (url: URL): Promise<PageResponse> => {
  const response = await requestOverNetwork(url, MAX_PAGE_BYTES);
  return { status: response.status, location: response.location, body: response.bytes.toString('utf8') };
};

const fetchImageOverNetwork = (url: URL): Promise<ImageResponse> => requestOverNetwork(url, MAX_IMAGE_BYTES);

const defaultImportDeps: ImportDeps = { fetchPage: fetchPageOverNetwork, lookup: resolveHost };
const defaultImageImportDeps: ImageImportDeps = { fetchImage: fetchImageOverNetwork, lookup: resolveHost };

// Every hop is checked before it is requested. The pinned lookup repeats the check at connect time.
async function assertPublicHost(url: URL, lookup: ImportDeps['lookup']): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIpLiteral(host)) {
    if (!isPublicAddress(host)) throw new RecipeImportError('blocked-address');
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host);
  } catch {
    throw new RecipeImportError('fetch-failed');
  }
  if (hasNonPublicAddress(addresses)) throw new RecipeImportError('blocked-address');
}

function nextLocation(location: string, current: URL): URL {
  // A redirect target is an external string, so it goes through the same sanitising rule as user input.
  if (sanitizeInput(location) !== location) throw new RecipeImportError('fetch-failed');
  try {
    return parseImportUrl(new URL(location, current).toString());
  } catch (error) {
    if (error instanceof RecipeImportError && error.code === 'invalid-url') throw error;
    throw new RecipeImportError('fetch-failed');
  }
}

export async function importRecipeFromUrl(rawUrl: string, deps: ImportDeps = defaultImportDeps): Promise<ExtractedRecipe> {
  let url = parseImportUrl(rawUrl);

  for (let hop = 0; ; hop++) {
    await assertPublicHost(url, deps.lookup);

    let response: PageResponse;
    try {
      response = await deps.fetchPage(url);
    } catch (error) {
      throw error instanceof RecipeImportError ? error : new RecipeImportError('fetch-failed');
    }

    if (response.status >= 300 && response.status < 400) {
      if (!response.location) throw new RecipeImportError('fetch-failed');
      if (hop >= MAX_REDIRECTS) throw new RecipeImportError('too-many-redirects');
      url = nextLocation(response.location, url);
      continue;
    }

    if (response.status < 200 || response.status >= 300) throw new RecipeImportError('fetch-failed');

    const recipe = extractRecipe(response.body);
    if (!recipe) throw new RecipeImportError('no-recipe');
    return recipe;
  }
}

// Downloads a recipe photo from its source page. Redirects are not followed, so the checked address is the one fetched.
export async function importImageFromUrl(
  rawUrl: string,
  deps: ImageImportDeps = defaultImageImportDeps,
): Promise<{ bytes: Buffer; contentType: string }> {
  const url = parseImportUrl(rawUrl);
  await assertPublicHost(url, deps.lookup);

  let response: ImageResponse;
  try {
    response = await deps.fetchImage(url);
  } catch (error) {
    throw error instanceof RecipeImportError ? error : new RecipeImportError('fetch-failed');
  }

  if (response.status < 200 || response.status >= 300) throw new RecipeImportError('fetch-failed');
  const contentType = response.contentType.split(';')[0].trim();
  if (!isAllowedImageType(contentType)) throw new RecipeImportError('not-an-image');
  return { bytes: response.bytes, contentType };
}

