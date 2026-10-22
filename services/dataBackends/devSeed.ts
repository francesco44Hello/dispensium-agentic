import type { RecipeBackend } from '../recipeService';
import type { SeedFile } from '../../types/seed';

// Local mock mode only: recipes fetched once with scripts/seed-dev-recipes.mjs are added to a household on first use,
// so a fresh page load already has them. Never used in production builds.

const SEED_USER = 'dev-seed';

function bytesOf(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)).buffer;
}

export function withDevSeed(backend: RecipeBackend, load: () => Promise<SeedFile | null>): RecipeBackend {
  const seeded = new Set<string>();

  async function seed(householdId: string): Promise<void> {
    const file = await load().catch(() => null);
    if (!file) return;
    for (const recipe of file.recipes) {
      const image = recipe.photoBase64 && recipe.photoType
        ? await backend.uploadPhoto(householdId, new Blob([bytesOf(recipe.photoBase64)], { type: recipe.photoType }))
        : '';
      await backend.addRecipe(householdId, {
        title: recipe.title,
        time: recipe.time,
        category: recipe.category,
        label: recipe.label,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        image,
        createdBy: SEED_USER,
      });
    }
  }

  return {
    ...backend,
    subscribeToRecipes(householdId, listener) {
      if (!seeded.has(householdId)) {
        seeded.add(householdId);
        void seed(householdId);
      }
      return backend.subscribeToRecipes(householdId, listener);
    },
  };
}
