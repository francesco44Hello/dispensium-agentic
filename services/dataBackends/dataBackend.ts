import type { HouseholdBackend } from '../householdService';
import type { GroceryBackend } from '../groceryService';
import type { RecipeBackend } from '../recipeService';
import type { MenuBackend } from '../menuService';

export interface DataBackend {
  households: HouseholdBackend;
  groceries: GroceryBackend;
  recipes: RecipeBackend;
  menu: MenuBackend;
}
