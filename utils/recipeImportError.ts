export type RecipeImportErrorCode =
  | 'invalid-url'
  | 'blocked-address'
  | 'too-many-redirects'
  | 'fetch-failed'
  | 'no-recipe'
  | 'too-large'
  | 'not-an-image';

export class RecipeImportError extends Error {
  code: RecipeImportErrorCode;

  constructor(code: RecipeImportErrorCode) {
    super(code);
    this.name = 'RecipeImportError';
    this.code = code;
  }
}

// HTTP status for each import failure. Every import route uses this one table.
export const RECIPE_IMPORT_STATUS: Record<RecipeImportErrorCode, number> = {
  'invalid-url': 400,
  'blocked-address': 400,
  'too-many-redirects': 502,
  'fetch-failed': 502,
  'no-recipe': 404,
  'too-large': 413,
  'not-an-image': 415,
};
