export const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
export type MealType = (typeof MEALS)[number];

export interface MealEntry {
  main: string;
  side: string;
  // Set when the text was picked from the household's recipes, so the meal can link to the recipe.
  mainRecipeId: string;
  sideRecipeId: string;
}

export interface DayMenu {
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
}

export const EMPTY_MEAL: MealEntry = { main: '', side: '', mainRecipeId: '', sideRecipeId: '' };

export function emptyDay(): DayMenu {
  return { breakfast: { ...EMPTY_MEAL }, lunch: { ...EMPTY_MEAL }, dinner: { ...EMPTY_MEAL } };
}

export function isMealType(value: string): value is MealType {
  return (MEALS as readonly string[]).includes(value);
}
