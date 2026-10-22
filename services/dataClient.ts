import { createGroceryService } from './groceryService';
import { createHouseholdService } from './householdService';
import { createRecipeService } from './recipeService';
import { isMockAuth } from './authClient';
import { createFirestoreDataBackend } from './dataBackends/firestoreDataBackend';
import { createMemoryDataBackend } from './dataBackends/memoryDataBackend';

// Same switch as auth: mock mode keeps all data in memory, otherwise Firestore is used.
const backend = isMockAuth ? createMemoryDataBackend() : createFirestoreDataBackend();

export const householdService = createHouseholdService(backend.households);
export const groceryService = createGroceryService(backend.groceries);
export const recipeService = createRecipeService(backend.recipes);
