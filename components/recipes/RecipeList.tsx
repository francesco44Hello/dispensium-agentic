import type { Recipe } from '../../types/recipe';
import { RecipeCard } from './RecipeCard';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './RecipeList.module.css';

interface Props {
  recipes: Recipe[];
}

export function RecipeList({ recipes }: Props) {
  const { t } = useLocale();
  if (recipes.length === 0) {
    return <p className={styles.empty}>{t('recipes.empty')}</p>;
  }

  return (
    <ul className={styles.list}>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  );
}
