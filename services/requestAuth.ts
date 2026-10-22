import { verifyIdToken } from '../utils/verifyIdToken';
import { AuthError, KeysUnavailableError } from '../utils/requestAuthErrors';

// Google publishes the certificates that sign Firebase ID tokens.
const CERTIFICATES_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const DEFAULT_MAX_AGE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 5000;
// A new key id can trigger one refetch, but not more than once a minute, so random ids cannot flood Google.
const MIN_REFETCH_MS = 60_000;


interface PublishedKeys {
  keys: Record<string, string>;
  maxAgeSeconds: number;
}

// Keeps the published keys until they expire. Lookups use a Map, so names like "constructor" are never keys.
// Concurrent callers share one fetch, and a failed fetch is not repeated for a minute.
export function createKeyCache(fetchKeys: () => Promise<PublishedKeys>, now: () => number = Date.now) {
  let keys = new Map<string, string>();
  let expires = 0;
  let lastFetch = Number.NEGATIVE_INFINITY;
  let pending: Promise<void> | null = null;

  const refresh = (): Promise<void> => {
    pending ??= (async () => {
      lastFetch = now();
      try {
        const published = await fetchKeys();
        keys = new Map(Object.entries(published.keys));
        expires = now() + published.maxAgeSeconds * 1000;
      } catch {
        throw new KeysUnavailableError('could not load signing keys');
      } finally {
        pending = null;
      }
    })();
    return pending;
  };

  return async (kid: string): Promise<string | undefined> => {
    if (pending) {
      await pending;
    } else if ((now() >= expires || !keys.has(kid)) && now() - lastFetch >= MIN_REFETCH_MS) {
      await refresh();
    }
    if (keys.size === 0) throw new KeysUnavailableError('no signing keys available');
    return keys.get(kid);
  };
}

async function fetchGoogleKeys(): Promise<PublishedKeys> {
  const response = await fetch(CERTIFICATES_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new AuthError('could not load signing keys');
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null) throw new AuthError('could not load signing keys');
  const keys: Record<string, string> = {};
  for (const [id, pem] of Object.entries(body)) {
    if (typeof pem === 'string') keys[id] = pem;
  }
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') ?? '')?.[1] ?? DEFAULT_MAX_AGE_SECONDS);
  return { keys, maxAgeSeconds: maxAge };
}

const googleKey = createKeyCache(fetchGoogleKeys);

// Returns the signed-in user's id, or throws AuthError. Routes call this before doing any work.
// Local mock mode (never in production builds) has no real sign-in, so the check is skipped there.
export async function authenticateRequest(request: Request): Promise<string> {
  if (process.env.NEXT_PUBLIC_AUTH_MOCK === 'true' && process.env.NODE_ENV !== 'production') return 'mock-user';

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) throw new AuthError('missing token');

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  if (!projectId) throw new AuthError('project is not configured');

  try {
    return await verifyIdToken(token, { projectId, getKey: googleKey });
  } catch (error) {
    if (error instanceof KeysUnavailableError) throw error;
    throw new AuthError('invalid token');
  }
}
