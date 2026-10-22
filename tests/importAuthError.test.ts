import { describe, it, expect } from 'vitest';
import { importAuthFailure } from '../utils/importAuthError';
import { AuthError, KeysUnavailableError } from '../utils/requestAuthErrors';
import { RECIPE_IMPORT_STATUS } from '../utils/recipeImportError';

describe('importAuthFailure', () => {
  it('answers 401 for a missing or invalid sign-in', async () => {
    const response = importAuthFailure(new AuthError());
    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: 'Sign in to import recipes.' });
  });

  it('answers 503 when the sign-in keys cannot be fetched', async () => {
    const response = importAuthFailure(new KeysUnavailableError());
    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ error: 'Try again in a moment.' });
  });

  it('returns null for any other error so the caller rethrows it', () => {
    expect(importAuthFailure(new Error('boom'))).toBeNull();
  });
});

describe('RECIPE_IMPORT_STATUS', () => {
  it('maps every import failure to its status', () => {
    expect(RECIPE_IMPORT_STATUS).toEqual({
      'invalid-url': 400,
      'blocked-address': 400,
      'too-many-redirects': 502,
      'fetch-failed': 502,
      'no-recipe': 404,
      'too-large': 413,
      'not-an-image': 415,
    });
  });
});
