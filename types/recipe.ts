// Same options as the legacy app. The service validates against these lists.
export const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks', 'Desserts'] as const;
export const RECIPE_LABELS = ['Summer Fresh ☀️', 'Cozy Winter ❄️', 'Quick & Easy ⚡', 'Comfort Food 🥣'] as const;

export interface RecipeDraft {
  title: string;
  time: string;
  category: string;
  label: string;
  ingredients: string[];
  steps: string[];
  image: string;
}

export interface Recipe extends RecipeDraft {
  id: string;
  createdAt: Date;
  createdBy: string;
}

// What the import route returns. Shared by the route, the import service and the form.
export interface ExtractedRecipe {
  title: string;
  ingredients: string[];
  steps: string[];
  image: string;
}
