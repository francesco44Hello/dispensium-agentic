'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { recipeService } from '../../services/dataClient';
import type { Recipe, RecipeDraft } from '../../types/recipe';
import { RecipeList } from './RecipeList';
import { RecipeSheet } from './RecipeSheet';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './RecipesScreen.module.css';

export function RecipesScreen() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { status, householdId, error } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!householdId) return;
    return recipeService.subscribeToRecipes(householdId, setRecipes);
  }, [householdId]);

  const save = async (draft: RecipeDraft, photo: Blob | null) => {
    if (!householdId || !user) return;
    setSaving(true);
    setSaveError('');
    try {
      await recipeService.addRecipe(householdId, user.uid, draft, photo ?? undefined);
      setSheetOpen(false);
    } catch {
      setSaveError(t('recipes.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const ready = status === 'ready' && householdId && user;
  const openSheet = () => setSheetOpen(true);

  return (
    <AppShell onAdd={openSheet}>
      <div className={styles.page}>
        <h1 className={styles.title}>{t('recipes.title')}</h1>
        {/* Desktop only: the floating add button is hidden there, so this link opens the full-page form instead. */}
        <Link href="/recipes/new" className={styles.addDesktop}>
          {t('nav.addRecipe')}
        </Link>
        {status === 'error' && (
          <p role="alert">{t('household.loadErrorDetail', { error: error ?? t('error.unknownDetail') })}</p>
        )}
        {status !== 'error' && !ready && <p role="status">{t('recipes.loading')}</p>}
        {ready && <RecipeList recipes={recipes} />}
      </div>
      <RecipeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={save}
        saving={saving}
        error={saveError}
      />
    </AppShell>
  );
}
