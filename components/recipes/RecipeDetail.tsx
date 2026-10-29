import { useState } from 'react';
import Link from 'next/link';
import { MdAccessTime, MdAddShoppingCart, MdArrowBack, MdCategory, MdCheck } from 'react-icons/md';
import type { Recipe } from '../../types/recipe';
import { RECIPE_CATEGORY_KEYS, RECIPE_LABEL_KEYS, translateStored } from '../../i18n/messages';
import styles from './RecipeDetail.module.css';
import { useLocale } from '../i18n/LocaleProvider';

const PLACEHOLDER_IMAGE = '/fruit-login.jpg';

// Layout copied from the legacy recipe page: hero image, overlapping card, ingredients and numbered steps.
interface Props {
  recipe: Recipe;
  imageUrl: string;
  onAddIngredient: (ingredient: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function RecipeDetail({ recipe, imageUrl, onAddIngredient, onDelete }: Props) {
  const { t } = useLocale();
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Deleting is a second step: the first press only asks, so a stray tap cannot remove a recipe.
  const remove = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleteError(t('recipes.deleteFailed'));
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  const addToList = async (ingredient: string) => {
    setError('');
    try {
      await onAddIngredient(ingredient);
      setAdded((current) => [...current, ingredient]);
    } catch {
      setError(t('recipes.addIngredientFailed', { item: ingredient }));
    }
  };

  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <Link href="/recipes" className={styles.back} aria-label={t('recipes.back')}>
          <MdArrowBack aria-hidden="true" />
        </Link>
        {/* Cover images come from other sites, so a plain img keeps the markup simple. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} className={styles.image} />
      </div>

      <div className={styles.card}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{recipe.label ? translateStored(recipe.label, RECIPE_LABEL_KEYS, t) : t('recipes.delicious')}</span>
        </div>

        <h1 className={styles.title}>{recipe.title}</h1>

        <div className={styles.info}>
          <span className={styles.infoItem}>
            <MdAccessTime aria-hidden="true" className={styles.icon} />
            <span>{recipe.time || '--'}</span>
          </span>
          <span className={styles.infoItem}>
            <MdCategory aria-hidden="true" className={styles.icon} />
            <span>{recipe.category ? translateStored(recipe.category, RECIPE_CATEGORY_KEYS, t) : '--'}</span>
          </span>
        </div>

        <hr className={styles.divider} />

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('recipes.ingredients')}</h2>
          <ul className={styles.ingredients} aria-label={t('recipes.ingredients')}>
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
                    aria-label={t(isAdded ? 'recipes.addedToList' : 'recipes.addToList', { item: ingredient })}
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
          <h2 className={styles.sectionTitle}>{t('recipes.instructions')}</h2>
          <ol className={styles.steps}>
            {recipe.steps.map((step, i) => (
              <li key={`${i}-${step}`} className={styles.step}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <p className={styles.stepText}>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.danger}>
          {confirming ? (
            <div className={styles.confirm}>
              <p className={styles.confirmText}>{t('recipes.deleteAsk')}</p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.cancelButton} disabled={deleting} onClick={() => setConfirming(false)}>
                  {t('common.cancel')}
                </button>
                <button type="button" className={styles.deleteButton} disabled={deleting} onClick={() => void remove()}>
                  {t('recipes.deleteConfirm')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={styles.deleteButton} onClick={() => setConfirming(true)}>
              {t('recipes.delete')}
            </button>
          )}
          {deleteError && <p role="alert" className={styles.error}>{deleteError}</p>}
        </section>
      </div>
    </article>
  );
}
