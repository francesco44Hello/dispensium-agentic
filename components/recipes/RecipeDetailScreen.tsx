'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useRecipePhoto } from '../../hooks/useRecipePhoto';
import { groceryService, recipeService } from '../../services/dataClient';
import type { Recipe } from '../../types/recipe';
import { RecipeDetail } from './RecipeDetail';
import { useLocale } from '../i18n/LocaleProvider';

// Loads the household's recipes and picks the one in the URL. Recipes are few, so the whole list is fine.
export function RecipeDetailScreen({ id }: { id: string }) {
  const { t } = useLocale();
  const { user } = useAuth();
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
    await groceryService.addItem(householdId, user.uid, ingredient);
  };

  let content;
  if (status === 'error') {
    content = <p role="alert">{t('household.loadErrorDetail', { error: error ?? t('error.unknownDetail') })}</p>;
  } else if (status !== 'ready' || recipes === null) {
    content = <p role="status">{t('recipes.loadingOne')}</p>;
  } else if (!recipe) {
    content = <p role="alert">{t('recipes.notFound')}</p>;
  } else {
    content = <RecipeDetail recipe={recipe} imageUrl={imageUrl} onAddIngredient={addToShoppingList} />;
  }

  return (
    <AppShell hideHeader bleed desktopFullPage>
      {content}
    </AppShell>
  );
}
