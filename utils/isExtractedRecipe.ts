import type { ExtractedRecipe } from '../types/recipe';

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

// Checks a response from our own route before the form trusts it.
export function isExtractedRecipe(value: unknown): value is ExtractedRecipe {
  if (typeof value !== 'object' || value === null) return false;
  return 'title' in value && typeof value.title === 'string'
    && 'image' in value && typeof value.image === 'string'
    && 'ingredients' in value && isStringList(value.ingredients)
    && 'steps' in value && isStringList(value.steps);
}
