'use client';

import { useEffect, useRef, useState } from 'react';
import { RecipeForm } from './RecipeForm';
import type { PhotoChange } from '../../services/recipeService';
import type { Recipe, RecipeDraft } from '../../types/recipe';

interface Props {
  recipe: Recipe;
  // The saved photo, as the page shows it. Empty when the recipe has no photo.
  imageUrl: string;
  saving: boolean;
  error: string;
  onSave: (draft: RecipeDraft, change: PhotoChange) => void | Promise<void>;
  onCancel: () => void;
}

// An untouched photo is kept, a picked one replaces it, and a removed one leaves the recipe without a photo.
function photoChange(touched: boolean, photo: Blob | null): PhotoChange {
  if (!touched) return { kind: 'keep' };
  if (photo) return { kind: 'replace', photo };
  return { kind: 'remove' };
}

// Starts from the saved recipe. The photo is only changed when the user picks or removes one: an untouched photo is kept.
export function RecipeEdit({ recipe, imageUrl, saving, error, onSave, onCancel }: Props) {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [touched, setTouched] = useState(false);
  // A ref as well as state, so the photo fetch below can tell whether the user has already changed it.
  const touchedRef = useRef(false);

  // Loads the saved photo into the form, so it shows as the cover while editing.
  useEffect(() => {
    if (!imageUrl) return;
    let active = true;
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        if (active && !touchedRef.current) setPhoto(blob);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [imageUrl]);

  const changePhoto = (next: Blob | null) => {
    touchedRef.current = true;
    setTouched(true);
    setPhoto(next);
  };

  const submit = (draft: RecipeDraft) => onSave(draft, photoChange(touched, photo));

  return (
    <RecipeForm
      onSubmit={submit}
      photo={photo}
      onPhotoChange={changePhoto}
      initial={{
        title: recipe.title,
        time: recipe.time,
        category: recipe.category,
        label: recipe.label,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      }}
      saving={saving}
      error={error}
      onCancel={onCancel}
    />
  );
}
