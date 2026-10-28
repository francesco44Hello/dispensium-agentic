'use client';

import { useState } from 'react';
import { compressImage } from '../../utils/compressImage';
import { currentIdToken } from '../../services/authClient';
import type { ExtractedRecipe, RecipeDraft } from '../../types/recipe';
import { ImportPanel } from './ImportPanel';
import { RecipeForm } from './RecipeForm';
import styles from './RecipeEditor.module.css';

interface Props {
  onSave: (draft: RecipeDraft, photo: Blob | null) => void | Promise<void>;
  saving?: boolean;
  error?: string;
}

// The photo is copied through our own route, so the browser never loads the source site's image directly.
// A failed copy is not an error for the import: the text is still usable and the photo can be added by hand.
async function fetchPhoto(url: string): Promise<Blob | null> {
  try {
    const response = await fetch('/api/recipe-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await currentIdToken()}` },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return null;
    return await compressImage(await response.blob());
  } catch {
    return null;
  }
}

// The import result and its photo live in one state object. A photo is ignored unless it still belongs to the current import,
// so a late copy from an earlier import, or one that finishes after the editor was left, never lands in the wrong form.
interface Session {
  version: number;
  recipe: ExtractedRecipe | null;
  photo: Blob | null;
}

// The import panel and the recipe form. Each mount starts empty, so the sheet and the full page remount it when they open.
export function RecipeEditor({ onSave, saving, error }: Props) {
  const [session, setSession] = useState<Session>({ version: 0, recipe: null, photo: null });

  const handleImported = (recipe: ExtractedRecipe) => {
    setSession((current) => ({ version: current.version + 1, recipe, photo: null }));
    if (!recipe.image) return;
    void fetchPhoto(recipe.image).then((fetched) => {
      if (fetched) setSession((current) => (current.recipe === recipe ? { ...current, photo: fetched } : current));
    });
  };

  const setPhoto = (photo: Blob | null) => setSession((current) => ({ ...current, photo }));

  return (
    <>
      <div className={styles.layout}>
        <ImportPanel onImported={handleImported} />
        <RecipeForm
          key={session.version}
          initial={session.recipe ?? undefined}
          photo={session.photo}
          onPhotoChange={setPhoto}
          onSubmit={onSave}
          saving={saving}
          error={error}
        />
      </div>
    </>
  );
}
