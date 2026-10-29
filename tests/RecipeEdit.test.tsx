// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { RecipeEdit, photoChange } from '../components/recipes/RecipeEdit';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import type { Recipe, RecipeDraft } from '../types/recipe';
import type { PhotoChange } from '../services/recipeService';

// jsdom has no canvas, so the photo is compressed by a stub here.
vi.mock('../utils/compressImage', () => ({
  compressImage: vi.fn(async () => new Blob(['y'], { type: 'image/webp' })),
}));

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const recipe: Recipe = {
  id: 'r1',
  title: 'Soup',
  time: '20 min',
  category: 'Dinner',
  label: 'Comfort Food 🥣',
  ingredients: ['water', 'salt'],
  steps: ['Boil'],
  image: '',
  createdAt: new Date(0),
  createdBy: 'alice',
};

function renderEdit(overrides: { recipe?: Recipe; imageUrl?: string; error?: string } = {}) {
  const onSave = vi.fn<(draft: RecipeDraft, change: PhotoChange) => Promise<void>>(async () => undefined);
  const onCancel = vi.fn();
  render(
    <LocaleProvider>
      <RecipeEdit
        recipe={overrides.recipe ?? recipe}
        imageUrl={overrides.imageUrl ?? ''}
        saving={false}
        error={overrides.error ?? ''}
        onSave={onSave}
        onCancel={onCancel}
      />
    </LocaleProvider>,
  );
  return { onSave, onCancel };
}

describe('RecipeEdit', () => {
  it('starts with the values of the recipe', () => {
    renderEdit();
    expect(screen.getByRole('textbox', { name: 'Recipe title' })).toHaveValue('Soup');
    expect(screen.getByLabelText('Ingredient 2')).toHaveValue('salt');
    expect(screen.getByLabelText('Step 1')).toHaveValue('Boil');
  });

  it('saves the edited text and keeps the photo when it was not changed', async () => {
    const props = renderEdit();
    fireEvent.change(screen.getByRole('textbox', { name: 'Recipe title' }), { target: { value: 'Better soup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalledOnce());
    const [draft, change] = props.onSave.mock.calls[0];
    expect(draft.title).toBe('Better soup');
    expect(change).toEqual({ kind: 'keep' });
  });

  it('goes back without saving when cancel is pressed', () => {
    const props = renderEdit();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it('shows the error from a failed save', () => {
    renderEdit({ error: 'Could not save the recipe.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save the recipe.');
  });
});

// The photo decision is tested directly, so it does not depend on when a saved photo finishes loading.
describe('photoChange', () => {
  it('keeps the photo when the user has not changed it', () => {
    expect(photoChange(false, null)).toEqual({ kind: 'keep' });
  });

  it('replaces the photo when a new one was picked', () => {
    const picked = new Blob(['y'], { type: 'image/webp' });
    expect(photoChange(true, picked)).toEqual({ kind: 'replace', photo: picked });
  });

  it('removes the photo when it was taken off', () => {
    expect(photoChange(true, null)).toEqual({ kind: 'remove' });
  });
});
