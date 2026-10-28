'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import type { RecipeDraft } from '../../types/recipe';
import { RecipeEditor } from './RecipeEditor';
import styles from './RecipeSheet.module.css';
import { useLocale } from '../i18n/LocaleProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (draft: RecipeDraft, photo: Blob | null) => void | Promise<void>;
  saving?: boolean;
  error?: string;
}

// Slides up from the bottom on mobile. Each opening starts empty: the editor remounts when the sheet opens.
export function RecipeSheet({ open, onClose, onSave, saving, error }: Props) {
  const { t } = useLocale();
  const [openCount, setOpenCount] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);

  // Adjusting state during render avoids a flash of the previous values.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpenCount((count) => count + 1);
  }

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
        <RecipeEditor key={openCount} onSave={onSave} saving={saving} error={error} />
      </div>
    </div>
  );
}
