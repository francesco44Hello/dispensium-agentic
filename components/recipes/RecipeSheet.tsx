'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { compressImage } from '../../utils/compressImage';
import { currentIdToken } from '../../services/authClient';
import type { ExtractedRecipe, RecipeDraft } from '../../types/recipe';
import { ImportPanel } from './ImportPanel';
import { RecipeForm } from './RecipeForm';
import styles from './RecipeSheet.module.css';
import { useLocale } from '../i18n/LocaleProvider';

interface Props {
  open: boolean;
  onClose: () => void;
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
// so a late copy from an earlier import, or one that finishes after the sheet closed, never lands in the wrong form.
interface Session {
  version: number;
  recipe: ExtractedRecipe | null;
  photo: Blob | null;
}

// Slides up from the bottom. Each opening starts empty; an import fills the form and fetches its photo.
export function RecipeSheet({ open, onClose, onSave, saving, error }: Props) {
  const { t } = useLocale();
  const [session, setSession] = useState<Session>({ version: 0, recipe: null, photo: null });
  const [wasOpen, setWasOpen] = useState(open);

  // Adjusting state during render avoids a flash of the previous values.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((current) => ({ version: current.version + 1, recipe: null, photo: null }));
  }

  const handleImported = (recipe: ExtractedRecipe) => {
    setSession((current) => ({ version: current.version + 1, recipe, photo: null }));
    if (!recipe.image) return;
    void fetchPhoto(recipe.image).then((fetched) => {
      if (fetched) setSession((current) => (current.recipe === recipe ? { ...current, photo: fetched } : current));
    });
  };

  const setPhoto = (photo: Blob | null) => setSession((current) => ({ ...current, photo }));

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="recipe-sheet-title" data-open={open ? 'true' : 'false'} className={styles.sheet} aria-hidden={!open} inert={!open}>
      <header className={styles.header}>
        <button type="button" className={styles.close} aria-label={t('recipes.close')} onClick={onClose}>
          <MdClose aria-hidden="true" />
        </button>
        <h2 id="recipe-sheet-title" className={styles.title}>{t('recipes.new')}</h2>
        <span className={styles.spacer} aria-hidden="true" />
      </header>
      <div className={styles.body}>
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
    </div>
  );
}
