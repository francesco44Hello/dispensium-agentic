'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { MdAdd, MdAddAPhoto, MdClose } from 'react-icons/md';
import { compressImage } from '../../utils/compressImage';
import { RECIPE_CATEGORIES, RECIPE_LABELS, type RecipeDraft } from '../../types/recipe';
import styles from './RecipeForm.module.css';
import { useLocale } from '../i18n/LocaleProvider';
import { RECIPE_CATEGORY_KEYS, RECIPE_LABEL_KEYS, translateStored } from '../../i18n/messages';

const DEFAULT_INGREDIENT_ROWS = 4;
const DEFAULT_STEP_ROWS = 3;
// Decoding a huge file can exhaust a phone's memory, so oversized picks are refused before decoding.
const MAX_PICK_BYTES = 20 * 1024 * 1024;

interface Props {
  // Receives the text fields and the compressed photo, if any. The photo is kept by the parent so it survives re-renders.
  onSubmit: (draft: RecipeDraft, photo: Blob | null) => void | Promise<void>;
  photo: Blob | null;
  onPhotoChange: (photo: Blob | null) => void;
  initial?: Partial<Omit<RecipeDraft, 'image'>>;
  saving?: boolean;
  error?: string;
  // When given, a cancel button is shown next to save. Used when editing an existing recipe.
  onCancel?: () => void;
}

// Blank rows are kept here so the user can fill them in; the service drops empty rows on save.
export function RecipeForm({ onSubmit, photo, onPhotoChange, initial, saving = false, error, onCancel }: Props) {
  const { t } = useLocale();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Dinner');
  const [label, setLabel] = useState(initial?.label ?? 'Quick & Easy ⚡');
  const [ingredients, setIngredients] = useState<string[]>(initial?.ingredients?.length ? initial.ingredients : Array(DEFAULT_INGREDIENT_ROWS).fill(''));
  const [steps, setSteps] = useState<string[]>(initial?.steps?.length ? initial.steps : Array(DEFAULT_STEP_ROWS).fill(''));
  const [photoError, setPhotoError] = useState('');

  // One object URL per photo. The effect's cleanup releases it when the photo changes or the form unmounts.
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const updateRow = (rows: string[], setRows: (next: string[]) => void, index: number, value: string) => {
    setRows(rows.map((row, i) => (i === index ? value : row)));
  };

  // A list always keeps at least one row, so the form never has nothing to type into.
  const removeRow = (rows: string[], setRows: (next: string[]) => void, index: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (file.size > MAX_PICK_BYTES) {
      setPhotoError('That photo is too large. Try one under 20 MB.');
      return;
    }
    try {
      onPhotoChange(await compressImage(file));
    } catch {
      setPhotoError('That photo could not be used. Try a JPEG, PNG or WebP image.');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({ title, time, category, label, ingredients, steps, image: '' }, photo);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.photoBox}>
        {preview ? (
          // Photos are local object URLs, so a plain img is right here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={t('recipes.coverAlt')} className={styles.coverImage} />
        ) : (
          <span className={styles.photoPlaceholder}>
            <MdAddAPhoto aria-hidden="true" /> {t('recipes.photo.add')}
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={t('recipes.photo')}
          className={styles.fileInput}
          onChange={handlePhoto}
        />
      </div>
      {preview && (
        <button type="button" className={styles.addRow} onClick={() => onPhotoChange(null)}>
          <MdClose aria-hidden="true" /> {t('recipes.photo.remove')}
        </button>
      )}
      {photoError && <p role="alert" className={styles.error}>{photoError}</p>}

      <div className={styles.section}>
        <label className={styles.field}>
          <span className={styles.visuallyHidden}>{t('recipes.titleField')}</span>
          <input
            type="text"
            placeholder={t('recipes.titleField')}
            className={`${styles.input} ${styles.inputLarge}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-label={t('recipes.titleField')}
          />
        </label>
        <div className={styles.row}>
          <input
            type="text"
            placeholder={t('recipes.timePlaceholder')}
            aria-label={t('recipes.time')}
            className={styles.input}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <select aria-label={t('recipes.category')} className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {RECIPE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {translateStored(option, RECIPE_CATEGORY_KEYS, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${styles.section} ${styles.wide}`}>
        <h3 className={styles.sectionTitle}>{t('recipes.perfectFor')}</h3>
        <div className={styles.pills}>
          {RECIPE_LABELS.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={label === option}
              className={`${styles.pill} ${label === option ? styles.pillActive : ''}`}
              onClick={() => setLabel(option)}
            >
              {t(RECIPE_LABEL_KEYS[option])}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('recipes.ingredients')}</h3>
        {ingredients.map((ingredient, i) => (
          <div key={`ingredient-${i}`} className={styles.itemRow}>
            <input
              type="text"
              placeholder={t('recipes.ingredientPlaceholder', { n: String(i + 1) })}
              aria-label={`Ingredient ${i + 1}`}
              className={styles.input}
              value={ingredient}
              onChange={(e) => updateRow(ingredients, setIngredients, i, e.target.value)}
            />
            {ingredients.length > 1 && (
              <button type="button" className={styles.removeRow} aria-label={t('recipes.removeIngredientRow', { n: String(i + 1) })} onClick={() => removeRow(ingredients, setIngredients, i)}>
                <MdClose aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button type="button" className={styles.addRow} onClick={() => setIngredients([...ingredients, ''])}>
          <MdAdd aria-hidden="true" /> {t('recipes.addIngredient')}
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('recipes.steps')}</h3>
        {steps.map((step, i) => (
          <div key={`step-${i}`} className={styles.itemRow}>
            <textarea
              placeholder={t('recipes.stepPlaceholder', { n: String(i + 1) })}
              aria-label={`Step ${i + 1}`}
              className={`${styles.input} ${styles.textarea}`}
              value={step}
              onChange={(e) => updateRow(steps, setSteps, i, e.target.value)}
            />
            {steps.length > 1 && (
              <button type="button" className={styles.removeRow} aria-label={t('recipes.removeStepRow', { n: String(i + 1) })} onClick={() => removeRow(steps, setSteps, i)}>
                <MdClose aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button type="button" className={styles.addRow} onClick={() => setSteps([...steps, ''])}>
          <MdAdd aria-hidden="true" /> {t('recipes.addStep')}
        </button>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      <div className={`${styles.actions} ${styles.wide}`}>
        {onCancel && (
          <button type="button" className={styles.cancel} disabled={saving} onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? t('recipes.saving') : t('recipes.save')}
        </button>
      </div>
    </form>
  );
}
