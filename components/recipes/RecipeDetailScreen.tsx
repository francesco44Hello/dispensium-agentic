'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useRecipePhoto } from '../../hooks/useRecipePhoto';
import { groceryService, recipeService } from '../../services/dataClient';
import { cleanIngredientName } from '../../utils/ingredientName';
import type { Recipe, RecipeDraft } from '../../types/recipe';
import type { PhotoChange } from '../../services/recipeService';
import { RecipeDetail } from './RecipeDetail';
import { useLocale } from '../i18n/LocaleProvider';

// Loads the household's recipes and picks the one in the URL. Recipes are few, so the whole list is fine.
export function RecipeDetailScreen({ id }: { id: string }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const { status, householdId, error } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    if (!householdId) return;
    return recipeService.subscribeToRecipes(householdId, setRecipes);
  }, [householdId]);

  const recipe = recipes?.find((candidate) => candidate.id === id);
  const imageUrl = useRecipePhoto(recipe?.image ?? '');

  const addToShoppingList = async (ingredient: string) => {
    if (!householdId || !user) throw new Error('not signed in');
    // The list gets the shopping name ("mature cheddar"), not the recipe line ("60g/2¼oz mature cheddar, grated").
    await groceryService.addItem(householdId, user.uid, cleanIngredientName(ingredient));
  };

  // The current photo path is passed along, so a text-only edit keeps the photo and a photo change can clean up the old file.
  const saveEdit = async (draft: RecipeDraft, change: PhotoChange) => {
    if (!householdId || !recipe) throw new Error('recipe not loaded');
    await recipeService.updateRecipe(householdId, recipe.id, recipe.image, draft, change);
  };

  // Left only after the delete succeeds; a failure is shown inside RecipeDetail and the recipe stays open.
  const deleteRecipe = async () => {
    if (!householdId || !recipe) throw new Error('recipe not loaded');
    await recipeService.deleteRecipe(householdId, recipe.id, recipe.image);
    router.replace('/recipes');
  };

  let content;
  if (status === 'error') {
    content = <p role="alert">{t('household.loadErrorDetail', { error: error ?? t('error.unknownDetail') })}</p>;
  } else if (status !== 'ready' || recipes === null) {
    content = <p role="status">{t('recipes.loadingOne')}</p>;
  } else if (!recipe) {
    content = <p role="alert">{t('recipes.notFound')}</p>;
  } else {
    content = (
      <RecipeDetail recipe={recipe} imageUrl={imageUrl} onAddIngredient={addToShoppingList} onDelete={deleteRecipe} onSave={saveEdit} />
    );
  }

  return (
    <AppShell hideHeader bleed desktopFullPage>
      {content}
    </AppShell>
  );
}
