// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

beforeAll(() => {
  // jsdom has no object URLs, and the form makes one for a chosen photo.
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const initial = { title: 'Soup', time: '20 min', ingredients: ['water', 'salt'], steps: ['Boil', 'Serve'] };

describe('RecipeForm for an edit', () => {
  it('starts with the values of the recipe', () => {
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={null} onPhotoChange={() => undefined} initial={initial} />
      </LocaleProvider>,
    );
    expect(screen.getByRole('textbox', { name: 'Recipe title' })).toHaveValue('Soup');
    expect(screen.getByLabelText('Ingredient 2')).toHaveValue('salt');
    expect(screen.getByLabelText('Step 1')).toHaveValue('Boil');
  });

  it('removes an ingredient row', () => {
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={null} onPhotoChange={() => undefined} initial={initial} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove ingredient row 1' }));
    expect(screen.getByLabelText('Ingredient 1')).toHaveValue('salt');
    expect(screen.queryByLabelText('Ingredient 2')).toBeNull();
  });

  it('removes a step row', () => {
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={null} onPhotoChange={() => undefined} initial={initial} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove step row 2' }));
    expect(screen.getByLabelText('Step 1')).toHaveValue('Boil');
    expect(screen.queryByLabelText('Step 2')).toBeNull();
  });

  it('calls onCancel from a cancel button when it is given', () => {
    const onCancel = vi.fn();
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={null} onPhotoChange={() => undefined} initial={initial} onCancel={onCancel} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('removes the photo with a button, and reports it as no photo', () => {
    const onPhotoChange = vi.fn();
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={new Blob(['x'], { type: 'image/webp' })} onPhotoChange={onPhotoChange} initial={initial} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
    expect(onPhotoChange).toHaveBeenCalledWith(null);
  });
});
