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
