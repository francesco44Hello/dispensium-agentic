import { sanitizeInput } from '../utils/sanitizeInput';
import { isAllowedImageType, MAX_PHOTO_BYTES } from '../utils/recipeImage';
import { RECIPE_CATEGORIES, RECIPE_LABELS, type Recipe, type RecipeDraft } from '../types/recipe';
import type { Unsubscribe } from '../types/subscription';

export type RecipeErrorCode =
  | 'invalid-title'
  | 'invalid-time'
  | 'invalid-category'
  | 'invalid-label'
  | 'invalid-ingredients'
  | 'invalid-steps'
  | 'invalid-image'
  | 'invalid-photo';

export class RecipeError extends Error {
  code: RecipeErrorCode;

  constructor(code: RecipeErrorCode) {
    super(code);
    this.name = 'RecipeError';
    this.code = code;
  }
}

export interface NewRecipe extends RecipeDraft {
  createdBy: string;
}

export interface RecipeBackend {
  // Returns the storage path of the new photo.
  uploadPhoto(householdId: string, photo: Blob): Promise<string>;
  deletePhoto(path: string): Promise<void>;
  // Returns a local URL for the photo, fetched through the database rules.
  photoUrl(path: string): Promise<string>;
  addRecipe(householdId: string, recipe: NewRecipe): Promise<string>;
  deleteRecipe(householdId: string, id: string): Promise<void>;
  subscribeToRecipes(householdId: string, listener: (recipes: Recipe[]) => void): Unsubscribe;
}

const MAX_TITLE = 100;
const MAX_TIME = 50;
const MAX_LIST_ITEMS = 50;
const MAX_INGREDIENT = 200;
const MAX_STEP = 1000;

// sanitizeInput strips blocked characters but does not trim, so both steps are needed.
const clean = (raw: string): string => sanitizeInput(raw).trim();

// Lists keep only the non-empty entries, so empty input rows are simply ignored.
function cleanList(raw: string[], maxItems: number, maxLength: number, code: RecipeErrorCode): string[] {
  const items = raw.map(clean).filter(Boolean);
  if (items.length > maxItems || items.some((item) => item.length > maxLength)) throw new RecipeError(code);
  return items;
}

function validate(draft: RecipeDraft) {
  const title = clean(draft.title);
  if (!title || title.length > MAX_TITLE) throw new RecipeError('invalid-title');

  const time = clean(draft.time);
  if (time.length > MAX_TIME) throw new RecipeError('invalid-time');

  if (!(RECIPE_CATEGORIES as readonly string[]).includes(draft.category)) throw new RecipeError('invalid-category');
  if (!(RECIPE_LABELS as readonly string[]).includes(draft.label)) throw new RecipeError('invalid-label');
  // Images are never links to other sites. A photo is only ever a storage path created by uploadPhoto.
  if (draft.image.trim() !== '') throw new RecipeError('invalid-image');

  return {
    title,
    time,
    category: draft.category,
    label: draft.label,
    ingredients: cleanList(draft.ingredients, MAX_LIST_ITEMS, MAX_INGREDIENT, 'invalid-ingredients'),
    steps: cleanList(draft.steps, MAX_LIST_ITEMS, MAX_STEP, 'invalid-steps'),
  };
}

export function createRecipeService(backend: RecipeBackend) {
  return {
    async addRecipe(householdId: string, uid: string, draft: RecipeDraft, photo?: Blob): Promise<string> {
      const valid = validate(draft);
      if (!photo) return backend.addRecipe(householdId, { ...valid, image: '', createdBy: uid });

      if (!isAllowedImageType(photo.type) || photo.size > MAX_PHOTO_BYTES) throw new RecipeError('invalid-photo');
      const image = await backend.uploadPhoto(householdId, photo);
      try {
        return await backend.addRecipe(householdId, { ...valid, image, createdBy: uid });
      } catch (error) {
        // The recipe was not saved, so the photo would be orphaned. Remove it, then report the original failure.
        await backend.deletePhoto(image).catch(() => undefined);
        throw error;
      }
    },

    // The recipe goes first: if its photo cannot be removed, the recipe is still gone and the photo is only an orphan.
    async deleteRecipe(householdId: string, id: string, image: string): Promise<void> {
      await backend.deleteRecipe(householdId, id);
      if (image) await backend.deletePhoto(image).catch(() => undefined);
    },

    subscribeToRecipes(householdId: string, listener: (recipes: Recipe[]) => void): Unsubscribe {
      return backend.subscribeToRecipes(householdId, listener);
    },

    photoUrl(path: string): Promise<string> {
      return backend.photoUrl(path);
    },
  };
}
