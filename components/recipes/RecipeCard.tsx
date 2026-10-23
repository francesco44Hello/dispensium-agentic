import Link from 'next/link';
import { BiCategory } from 'react-icons/bi';
import { FiClock } from 'react-icons/fi';
import { useRecipePhoto } from '../../hooks/useRecipePhoto';
import type { Recipe } from '../../types/recipe';
import { RECIPE_LABEL_KEYS } from '../../i18n/messages';
import styles from './RecipeCard.module.css';
import { useLocale } from '../i18n/LocaleProvider';

const PLACEHOLDER_IMAGE = '/fruit-login.jpg';

// Card layout copied from the legacy recipe list: photo on top, title, time and category, label bar at the bottom.
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t } = useLocale();
  const photoUrl = useRecipePhoto(recipe.image);

  const label = RECIPE_LABEL_KEYS[recipe.label] ? t(RECIPE_LABEL_KEYS[recipe.label]) : recipe.label;
  return (
    <Link href={`/recipes/${recipe.id}`} className={styles.link} aria-label={recipe.title}>
      <article className={styles.card}>
        <div className={styles.imageBox}>
          {/* Photos are local object URLs, so a plain img is right here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl || PLACEHOLDER_IMAGE} alt={recipe.title} className={styles.image} />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{recipe.title}</h3>
          <div className={styles.details}>
            <span className={styles.detail}>
              <FiClock aria-hidden="true" className={styles.icon} />
              <span>{recipe.time || 'N/A'}</span>
            </span>
            <span className={styles.detail}>
              <BiCategory aria-hidden="true" className={styles.icon} />
              <span>{recipe.category || 'Uncategorized'}</span>
            </span>
          </div>
        </div>

        {recipe.label && <div className={styles.label}>{label}</div>}
      </article>
    </Link>
  );
}
