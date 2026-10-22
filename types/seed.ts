// Shape of the local dev seed file (scripts/seed-dev-recipes.mjs). Mock mode only.
export interface SeedRecipe {
  title: string;
  time: string;
  category: string;
  label: string;
  ingredients: string[];
  steps: string[];
  photoBase64?: string;
  photoType?: string;
}

export interface SeedFile {
  recipes: SeedRecipe[];
}
