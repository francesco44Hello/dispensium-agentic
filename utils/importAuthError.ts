import { NextResponse } from 'next/server';
import { AuthError, KeysUnavailableError } from './requestAuthErrors';

// Maps a failed sign-in check on an import route to its response. Returns null for anything else,
// so the route can rethrow it.
export function importAuthFailure(error: unknown): NextResponse | null {
  if (error instanceof AuthError) return NextResponse.json({ error: 'Sign in to import recipes.' }, { status: 401 });
  if (error instanceof KeysUnavailableError) return NextResponse.json({ error: 'Try again in a moment.' }, { status: 503 });
  return null;
}
