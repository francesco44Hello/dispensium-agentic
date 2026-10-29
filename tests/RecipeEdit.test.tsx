// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { RecipeEdit } from '../components/recipes/RecipeEdit';
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

  it('removes the saved photo when it is taken off in the form', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['x'], { type: 'image/webp' }))));
    const props = renderEdit({ recipe: { ...recipe, image: 'households/hh-1/recipes/a.webp' }, imageUrl: 'blob:saved' });
    // The saved photo is fetched first, which can be slower on CI than the default one-second wait.
    await screen.findByRole('button', { name: 'Remove photo' }, { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalledOnce());
    expect(props.onSave.mock.calls[0][1]).toEqual({ kind: 'remove' });
  });

  it('replaces the photo when a new one is picked', async () => {
    const props = renderEdit();
    fireEvent.change(screen.getByLabelText('Recipe photo'), { target: { files: [new File(['y'], 'p.webp', { type: 'image/webp' })] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove photo' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(props.onSave).toHaveBeenCalledOnce());
    const change = props.onSave.mock.calls[0][1];
    expect(change.kind).toBe('replace');
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
