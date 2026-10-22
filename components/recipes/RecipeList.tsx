import type { Recipe } from '../../types/recipe';
import { RecipeCard } from './RecipeCard';
import styles from './RecipeList.module.css';

interface Props {
  recipes: Recipe[];
}

export function RecipeList({ recipes }: Props) {
  if (recipes.length === 0) {
    return <p className={styles.empty}>No recipes yet. Tap + to add your first one.</p>;
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
