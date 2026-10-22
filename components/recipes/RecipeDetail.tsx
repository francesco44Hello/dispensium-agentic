import { useState } from 'react';
import Link from 'next/link';
import { MdAccessTime, MdAddShoppingCart, MdArrowBack, MdCategory, MdCheck } from 'react-icons/md';
import type { Recipe } from '../../types/recipe';
import styles from './RecipeDetail.module.css';

const PLACEHOLDER_IMAGE = '/fruit-login.jpg';

// Layout copied from the legacy recipe page: hero image, overlapping card, ingredients and numbered steps.
interface Props {
  recipe: Recipe;
  imageUrl: string;
  onAddIngredient: (ingredient: string) => Promise<void>;
}

export function RecipeDetail({ recipe, imageUrl, onAddIngredient }: Props) {
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addToList = async (ingredient: string) => {
    setError('');
    try {
      await onAddIngredient(ingredient);
      setAdded((current) => [...current, ingredient]);
    } catch {
      setError(`Could not add ${ingredient} to your shopping list. Try again.`);
    }
  };

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <Link href="/recipes" className={styles.back} aria-label="Back to recipes">
          <MdArrowBack aria-hidden="true" />
        </Link>
        {/* Cover images come from other sites, so a plain img keeps the markup simple. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} className={styles.image} />
      </div>

      <div className={styles.card}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{recipe.label || 'Delicious'}</span>
        </div>

        <h1 className={styles.title}>{recipe.title}</h1>

        <div className={styles.info}>
          <span className={styles.infoItem}>
            <MdAccessTime aria-hidden="true" className={styles.icon} />
            <span>{recipe.time || '--'}</span>
          </span>
          <span className={styles.infoItem}>
            <MdCategory aria-hidden="true" className={styles.icon} />
            <span>{recipe.category || '--'}</span>
          </span>
        </div>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <ul className={styles.ingredients} aria-label="Ingredients">
            {recipe.ingredients.map((ingredient, i) => {
              const isAdded = added.includes(ingredient);
              return (
                <li key={`${ingredient}-${i}`} className={styles.ingredient}>
                  <span className={styles.ingredientText}>
                    <span className={styles.bullet} aria-hidden="true" />
                    <span>{ingredient}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.cart}
                    aria-label={isAdded ? `Added ${ingredient} to shopping list` : `Add ${ingredient} to shopping list`}
                    disabled={isAdded}
                    onClick={() => void addToList(ingredient)}
                  >
                    {isAdded ? <MdCheck aria-hidden="true" /> : <MdAddShoppingCart aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {error && <p role="alert" className={styles.error}>{error}</p>}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Instructions</h2>
          <ol className={styles.steps}>
            {recipe.steps.map((step, i) => (
              <li key={`${i}-${step}`} className={styles.step}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <p className={styles.stepText}>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
