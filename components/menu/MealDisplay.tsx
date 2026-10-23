import { FiEdit2, FiPlus } from 'react-icons/fi';
import { ImSpoonKnife } from 'react-icons/im';
import type { Recipe } from '../../types/recipe';
import type { MealEntry, MealType } from '../../types/menu';
import { RecipeMealCard } from './RecipeMealCard';
import styles from './MealDisplay.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { MEAL_KEYS } from '../../i18n/messages';

interface Props {
  meal: MealType;
  entry: MealEntry;
  recipes: Recipe[];
  onEdit: () => void;
}

// Shows the main and side of one meal. A meal linked to a recipe shows the recipe card; otherwise a custom card.
export function MealDisplay({ meal, entry, recipes, onEdit }: Props) {
  const { t } = useLocale();
  if (!entry.main && !entry.side) {
    return (
      <button type="button" aria-label={t('menu.addMeal', { meal: t(MEAL_KEYS[meal]) })} className={styles.empty} onClick={onEdit}>
        <span className={styles.emptyIcon}>
          <FiPlus />
        </span>
        <p>Tap to add {meal}</p>
      </button>
    );
  }

  const section = (label: string, text: string, recipeId: string) => {
    if (!text) return null;
    const recipe = recipes.find((candidate) => candidate.id === recipeId);
    return (
      <div className={styles.section}>
        <h3 className={styles.label}>{label}</h3>
        {recipe ? (
          <RecipeMealCard recipe={recipe} />
        ) : (
          <div className={styles.custom}>
            <div className={styles.customIcon}>
              <ImSpoonKnife />
            </div>
            <h3>{text}</h3>
            <p>{t('meal.custom')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <button type="button" className={styles.editButton} onClick={onEdit}>
        <FiEdit2 /> Edit {meal}
      </button>
      {section('Main', entry.main, entry.mainRecipeId)}
      {section('Side', entry.side, entry.sideRecipeId)}
    </div>
  );
}
