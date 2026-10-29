import type { Recipe } from '../types/recipe';

// A null label means "All": every recipe, including those with no label. Otherwise only the matching recipes are kept.
export function filterRecipesByLabel(recipes: Recipe[], label: string | null): Recipe[] {
  if (label === null) return [...recipes];
  return recipes.filter((recipe) => recipe.label === label);
}
