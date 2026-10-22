import { createGroceryService } from './groceryService';
import { createHouseholdService } from './householdService';
import { createRecipeService } from './recipeService';
import { createMenuService } from './menuService';
import { withDevSeed } from './dataBackends/devSeed';
import type { SeedFile } from '../types/seed';
import { isMockAuth } from './authClient';
import { createFirestoreDataBackend } from './dataBackends/firestoreDataBackend';
import { createMemoryDataBackend } from './dataBackends/memoryDataBackend';
import { isSeedFile } from '../utils/dataGuards';

// Same switch as auth: mock mode keeps all data in memory, otherwise Firestore is used.
const backend = isMockAuth ? createMemoryDataBackend() : createFirestoreDataBackend();

export const householdService = createHouseholdService(backend.households);
export const groceryService = createGroceryService(backend.groceries);
export const menuService = createMenuService(backend.menu);

// Local mock mode only: the seed file is written by `npm run dev:seed` into public/dev/ (git-ignored).
const loadDevSeed = async (): Promise<SeedFile | null> => {
  const response = await fetch('/dev/seed-recipes.json');
  if (!response.ok) return null;
  const body: unknown = await response.json();
  return isSeedFile(body) ? body : null;
};

const useDevSeed = isMockAuth && process.env.NODE_ENV !== 'production';
export const recipeService = createRecipeService(useDevSeed ? withDevSeed(backend.recipes, loadDevSeed) : backend.recipes);
