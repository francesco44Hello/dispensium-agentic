import type { HouseholdBackend } from '../householdService';
import type { GroceryBackend } from '../groceryService';

export interface DataBackend {
  households: HouseholdBackend;
  groceries: GroceryBackend;
}
