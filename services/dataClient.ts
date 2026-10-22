import { createGroceryService } from './groceryService';
import { createHouseholdService } from './householdService';
import { createRecipeService } from './recipeService';
import { createMenuService } from './menuService';
import { withDevSeed, type SeedFile } from './dataBackends/devSeed';
import { isMockAuth } from './authClient';
import { createFirestoreDataBackend } from './dataBackends/firestoreDataBackend';
import { createMemoryDataBackend } from './dataBackends/memoryDataBackend';

// Same switch as auth: mock mode keeps all data in memory, otherwise Firestore is used.
const backend = isMockAuth ? createMemoryDataBackend() : createFirestoreDataBackend();

export const householdService = createHouseholdService(backend.households);
export const groceryService = createGroceryService(backend.groceries);
export let recipeService = createRecipeService(backend.recipes);
export const menuService = createMenuService(backend.menu);

// Local mock mode only: the seed file is written by `npm run dev:seed` into public/dev/ (git-ignored).
const loadDevSeed = async (): Promise<SeedFile | null> => {
  const response = await fetch('/dev/seed-recipes.json');
  return response.ok ? ((await response.json()) as SeedFile) : null;
};

if (isMockAuth && process.env.NODE_ENV !== 'production') {
  const seededRecipes = withDevSeed(backend.recipes, loadDevSeed);
  recipeService = createRecipeService(seededRecipes);
}
