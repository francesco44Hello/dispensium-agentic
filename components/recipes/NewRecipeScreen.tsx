'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { recipeService } from '../../services/dataClient';
import type { RecipeDraft } from '../../types/recipe';
import { RecipeEditor } from './RecipeEditor';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './NewRecipeScreen.module.css';

// Desktop's full-page add recipe form. No bottom bar and no footer: the back link returns to the list.
export function NewRecipeScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async (draft: RecipeDraft, photo: Blob | null) => {
    if (!householdId || !user) return;
    setSaving(true);
    setSaveError('');
    try {
      await recipeService.addRecipe(householdId, user.uid, draft, photo ?? undefined);
      router.push('/recipes');
    } catch {
      setSaveError(t('recipes.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell hideHeader hideNav>
      <div className={styles.page}>
        <Link href="/recipes" className={styles.back}>
          {t('recipes.back')}
        </Link>
        <h1 className={styles.title}>{t('recipes.new')}</h1>
        <RecipeEditor onSave={save} saving={saving} error={saveError} />
      </div>
    </AppShell>
  );
}
