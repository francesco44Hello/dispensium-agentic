import { NextResponse } from 'next/server';
import { AuthError, authenticateRequest, KeysUnavailableError } from '../../../services/requestAuth';
import { importImageFromUrl, RecipeImportError } from '../../../services/recipeImportService';
import { sanitizeInput } from '../../../utils/sanitizeInput';
import { readCapped } from '../../../utils/readCapped';
import type { RecipeImportErrorCode } from '../../../utils/recipeImportError';

const MAX_BODY_CHARS = 4096;

const STATUS: Record<RecipeImportErrorCode, number> = {
  'invalid-url': 400,
  'blocked-address': 400,
  'too-many-redirects': 502,
  'fetch-failed': 502,
  'no-recipe': 404,
  'too-large': 413,
  'not-an-image': 415,
};

// Returns the photo's bytes to the browser, which compresses them and uploads them to our own storage.
export async function POST(request: Request) {
  // Only signed-in users can use the importers, so the server is never an anonymous fetch proxy.
  try {
    await authenticateRequest(request);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: 'Sign in to import recipes.' }, { status: 401 });
    if (error instanceof KeysUnavailableError) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503 });
    throw error;
  }

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_CHARS) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });

  const text = await readCapped(request, MAX_BODY_CHARS);
  if (text === null) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Send the photo link as JSON.' }, { status: 400 });
  }
  const raw = typeof body === 'object' && body !== null && 'url' in body && typeof body.url === 'string' ? body.url : '';

  try {
    const { bytes, contentType } = await importImageFromUrl(sanitizeInput(raw).trim());
    return new Response(new Uint8Array(bytes), {
      headers: { 'content-type': contentType, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
    });
  } catch (error) {
    if (error instanceof RecipeImportError) {
      return NextResponse.json({ error: 'Could not fetch that photo.' }, { status: STATUS[error.code] });
    }
    console.error('Recipe photo import failed:', error);
    return NextResponse.json({ error: 'Could not fetch that photo.' }, { status: 500 });
  }
}
