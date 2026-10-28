import type { CategoryMap } from '../types/category';
import type { DayMenu, MealEntry } from '../types/menu';
import type { SeedFile, SeedRecipe } from '../types/seed';

// Runtime checks for data read from Firestore or fetched as JSON. Anything that does not match is rejected
// rather than cast, so a malformed document can never reach the UI as if it were valid.

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

export function isCategoryMap(value: unknown): value is CategoryMap {
  return isPlainObject(value) && Object.values(value).every(isStringList);
}

function isMealEntry(value: unknown): value is MealEntry {
  return (
    isPlainObject(value) &&
    typeof value.main === 'string' &&
    typeof value.side === 'string' &&
    typeof value.mainRecipeId === 'string' &&
    typeof value.sideRecipeId === 'string'
  );
}

// A day may be partly saved: each meal is optional, but one that is present must be a full entry.
export function isPartialDayMenu(value: unknown): value is Partial<DayMenu> {
  if (!isPlainObject(value)) return false;
  return (
    (value.breakfast === undefined || isMealEntry(value.breakfast)) &&
    (value.lunch === undefined || isMealEntry(value.lunch)) &&
    (value.dinner === undefined || isMealEntry(value.dinner))
  );
}

function isSeedRecipe(value: unknown): value is SeedRecipe {
  return (
    isPlainObject(value) &&
    typeof value.title === 'string' &&
    typeof value.time === 'string' &&
    typeof value.category === 'string' &&
    typeof value.label === 'string' &&
    isStringList(value.ingredients) &&
    isStringList(value.steps) &&
    (value.photoBase64 === undefined || typeof value.photoBase64 === 'string') &&
    (value.photoType === undefined || typeof value.photoType === 'string')
  );
}

export function isSeedFile(value: unknown): value is SeedFile {
  return isPlainObject(value) && Array.isArray(value.recipes) && value.recipes.every(isSeedRecipe);
}
