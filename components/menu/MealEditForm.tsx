'use client';

import { useId, useState, type FormEvent } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Recipe } from '../../types/recipe';
import type { MealEntry } from '../../types/menu';
import styles from './MealEditForm.module.css';
import { useLocale } from '../i18n/LocaleProvider';

const MAX_SUGGESTIONS = 5;
// Suggestions appear after the user pauses, not on every key.
const SUGGESTION_DELAY_MS = 250;

interface Props {
  entry: MealEntry;
  recipes: Recipe[];
  onSave: (entry: MealEntry) => void | Promise<void>;
  onCancel: () => void;
}

// Main or side: typed text, with household recipes suggested as you type. Picking one stores the recipe link.
function RecipeField({
  label,
  text,
  recipeId,
  recipes,
  onChange,
}: {
  label: string;
  text: string;
  recipeId: string;
  recipes: Recipe[];
  onChange: (text: string, recipeId: string) => void;
}) {
  const { t } = useLocale();
  const inputId = useId();
  const typed = useDebouncedValue(text, SUGGESTION_DELAY_MS).trim().toLowerCase();
  const linked = recipes.find((recipe) => recipe.id === recipeId);
  // Once a recipe is picked, its title is in the field and the list closes.
  const picked = linked !== undefined && linked.title === text;
  const suggestions = typed && !picked
    ? recipes.filter((recipe) => recipe.title.toLowerCase().includes(typed)).slice(0, MAX_SUGGESTIONS)
    : [];

  return (
    <div className={styles.group}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        className={styles.input}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          // Editing away from the recipe's title means the meal is no longer that recipe.
          onChange(next, linked && linked.title === next ? recipeId : '');
        }}
      />
      {suggestions.length > 0 && (
        <ul role="listbox" aria-label={t('menu.suggestions', { label })} className={styles.suggestions}>
          {suggestions.map((recipe) => (
            <li
              key={recipe.id}
              role="option"
              aria-selected={recipe.id === recipeId}
              tabIndex={0}
              className={styles.suggestion}
              onClick={() => onChange(recipe.title, recipe.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onChange(recipe.title, recipe.id);
              }}
            >
              {recipe.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MealEditForm({ entry, recipes, onSave, onCancel }: Props) {
  const { t } = useLocale();
  const [main, setMain] = useState(entry.main);
  const [mainRecipeId, setMainRecipeId] = useState(entry.mainRecipeId);
  const [side, setSide] = useState(entry.side);
  const [sideRecipeId, setSideRecipeId] = useState(entry.sideRecipeId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave({ main, side, mainRecipeId, sideRecipeId });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <RecipeField
        label={t('menu.main')}
        text={main}
        recipeId={mainRecipeId}
        recipes={recipes}
        onChange={(text, id) => {
          setMain(text);
          setMainRecipeId(id);
        }}
      />
      <RecipeField
        label={t('menu.sideOptional')}
        text={side}
        recipeId={sideRecipeId}
        recipes={recipes}
        onChange={(text, id) => {
          setSide(text);
          setSideRecipeId(id);
        }}
      />
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" className={styles.save}>
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
