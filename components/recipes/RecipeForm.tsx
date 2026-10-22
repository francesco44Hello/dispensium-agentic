'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { MdAdd, MdAddAPhoto } from 'react-icons/md';
import { compressImage } from '../../utils/compressImage';
import { RECIPE_CATEGORIES, RECIPE_LABELS, type RecipeDraft } from '../../types/recipe';
import styles from './RecipeForm.module.css';

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
}

// Blank rows are kept here so the user can fill them in; the service drops empty rows on save.
export function RecipeForm({ onSubmit, photo, onPhotoChange, initial, saving = false, error }: Props) {
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
          <img src={preview} alt="Recipe cover" className={styles.coverImage} />
        ) : (
          <span className={styles.photoPlaceholder}>
            <MdAddAPhoto aria-hidden="true" /> Add a cover photo
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Recipe photo"
          className={styles.fileInput}
          onChange={handlePhoto}
        />
      </div>
      {photoError && <p role="alert" className={styles.error}>{photoError}</p>}

      <div className={styles.section}>
        <label className={styles.field}>
          <span className={styles.visuallyHidden}>Recipe title</span>
          <input
            type="text"
            placeholder="Recipe title"
            className={`${styles.input} ${styles.inputLarge}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-label="Recipe title"
          />
        </label>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="Time (e.g. 45 min)"
            aria-label="Time"
            className={styles.input}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <select aria-label="Category" className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {RECIPE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Perfect for...</h3>
        <div className={styles.pills}>
          {RECIPE_LABELS.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={label === option}
              className={`${styles.pill} ${label === option ? styles.pillActive : ''}`}
              onClick={() => setLabel(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ingredients</h3>
        {ingredients.map((ingredient, i) => (
          <input
            key={`ingredient-${i}`}
            type="text"
            placeholder={`Ingredient ${i + 1}`}
            aria-label={`Ingredient ${i + 1}`}
            className={styles.input}
            value={ingredient}
            onChange={(e) => updateRow(ingredients, setIngredients, i, e.target.value)}
          />
        ))}
        <button type="button" className={styles.addRow} onClick={() => setIngredients([...ingredients, ''])}>
          <MdAdd aria-hidden="true" /> Add ingredient
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Steps</h3>
        {steps.map((step, i) => (
          <textarea
            key={`step-${i}`}
            placeholder={`Step ${i + 1}`}
            aria-label={`Step ${i + 1}`}
            className={`${styles.input} ${styles.textarea}`}
            value={step}
            onChange={(e) => updateRow(steps, setSteps, i, e.target.value)}
          />
        ))}
        <button type="button" className={styles.addRow} onClick={() => setSteps([...steps, ''])}>
          <MdAdd aria-hidden="true" /> Add step
        </button>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={saving}>
        {saving ? 'Saving…' : 'Save recipe'}
      </button>
    </form>
  );
}
