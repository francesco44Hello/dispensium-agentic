import Link from 'next/link';
import { useRecipePhoto } from '../../hooks/useRecipePhoto';
import type { Recipe } from '../../types/recipe';
import styles from './MealDisplay.module.css';
import { useLocale } from '../i18n/LocaleProvider';

// A planned meal that matches a recipe: the photo, title and time, linking to the recipe.
export function RecipeMealCard({ recipe }: { recipe: Recipe }) {
  const { t } = useLocale();
  const photoUrl = useRecipePhoto(recipe.image);
  return (
    <Link href={`/recipes/${recipe.id}`} className={styles.recipeLink}>
      <article className={styles.recipeCard}>
        <div className={styles.recipeImage}>
          {/* Photos are local object URLs, so a plain img is right here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl || '/fruit-login.jpg'} alt={recipe.title} />
        </div>
        <div className={styles.recipeInfo}>
          <h3>{recipe.title}</h3>
          <div className={styles.recipeMeta}>
            <span>{recipe.time || '--'}</span>
            <span>•</span>
            <span className={styles.viewLink}>{t('recipes.viewRecipe')}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
