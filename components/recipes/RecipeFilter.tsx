'use client';

import { RECIPE_LABELS } from '../../types/recipe';
import { RECIPE_LABEL_KEYS } from '../../i18n/messages';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './RecipeFilter.module.css';

interface Props {
  selected: string | null;
  onSelect: (label: string | null) => void;
}

// One label at a time. Null is "All", so the chosen chip is always the one shown as pressed.
export function RecipeFilter({ selected, onSelect }: Props) {
  const { t } = useLocale();

  return (
    <div role="group" aria-label={t('recipes.filter.group')} className={styles.filter}>
      <button
        type="button"
        className={styles.chip}
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        {t('recipes.filter.all')}
      </button>
      {RECIPE_LABELS.map((label) => (
        <button
          key={label}
          type="button"
          className={styles.chip}
          aria-pressed={selected === label}
          onClick={() => onSelect(label)}
        >
          {t(RECIPE_LABEL_KEYS[label])}
        </button>
      ))}
    </div>
  );
}
