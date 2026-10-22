'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../AppShell';
import { useHousehold } from '../../hooks/useHousehold';
import { useRecipePhoto } from '../../hooks/useRecipePhoto';
import { recipeService } from '../../services/dataClient';
import type { Recipe } from '../../types/recipe';
import { RecipeDetail } from './RecipeDetail';

// Loads the household's recipes and picks the one in the URL. Recipes are few, so the whole list is fine.
export function RecipeDetailScreen({ id }: { id: string }) {
  const { status, householdId, error } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    if (!householdId) return;
    return recipeService.subscribeToRecipes(householdId, setRecipes);
  }, [householdId]);

  const recipe = recipes?.find((candidate) => candidate.id === id);
  const imageUrl = useRecipePhoto(recipe?.image ?? '');

  let content;
  if (status === 'error') {
    content = <p role="alert">We could not load your household ({error ?? 'unknown error'}). Please refresh the page.</p>;
  } else if (status !== 'ready' || recipes === null) {
    content = <p role="status">Loading recipe…</p>;
  } else if (!recipe) {
    content = <p role="alert">This recipe does not exist, or it was deleted.</p>;
  } else {
    content = <RecipeDetail recipe={recipe} imageUrl={imageUrl} />;
  }

  return <AppShell>{content}</AppShell>;
}
