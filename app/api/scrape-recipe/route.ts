import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../services/requestAuth';
import { importRecipeFromUrl } from '../../../services/recipeImportService';
import { sanitizeInput } from '../../../utils/sanitizeInput';
import { readCapped } from '../../../utils/readCapped';
import { RECIPE_IMPORT_STATUS, RecipeImportError, type RecipeImportErrorCode } from '../../../utils/recipeImportError';
import { importAuthFailure } from '../../../utils/importAuthError';

// The request is a single URL, so a larger body is refused before it is parsed.
const MAX_BODY_CHARS = 4096;

const MESSAGE: Record<RecipeImportErrorCode, string> = {
  'invalid-url': 'Use a full https link, for example https://site.com/recipe.',
  'blocked-address': 'That link cannot be imported.',
  'too-many-redirects': 'That page redirects too many times.',
  'fetch-failed': 'Could not open that page.',
  'no-recipe': 'Could not find a recipe on this page.',
  'too-large': 'That page is too large to import.',
  'not-an-image': 'That link is not a photo.',
};

export async function POST(request: Request) {
  // Only signed-in users can use the importers, so the server is never an anonymous fetch proxy.
  try {
    await authenticateRequest(request);
  } catch (error) {
    const failure = importAuthFailure(error);
    if (failure) return failure;
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
    return NextResponse.json({ error: MESSAGE['invalid-url'] }, { status: 400 });
  }
  const raw = typeof body === 'object' && body !== null && 'url' in body && typeof body.url === 'string' ? body.url : '';
  // Every external string goes through sanitizeInput (CLAUDE.md rule 3) before it is used.
  const url = sanitizeInput(raw).trim();

  try {
    return NextResponse.json(await importRecipeFromUrl(url));
  } catch (error) {
    if (error instanceof RecipeImportError) {
      return NextResponse.json({ error: MESSAGE[error.code] }, { status: RECIPE_IMPORT_STATUS[error.code] });
    }
    console.error('Recipe import failed:', error);
    return NextResponse.json({ error: 'Import failed. Try again later.' }, { status: 500 });
  }
}
