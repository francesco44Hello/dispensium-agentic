// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RecipeForm } from '../components/recipes/RecipeForm';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.setItem('dispensium-locale', 'it');
});

describe('RecipeForm in Italian', () => {
  it('translates the form text, the category options and the label pills, keeping the stored values', async () => {
    render(
      <LocaleProvider>
        <RecipeForm onSubmit={() => undefined} photo={null} onPhotoChange={() => undefined} />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Ingredienti' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Passi' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Ingrediente 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salva ricetta' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Cena' })).toHaveValue('Dinner');
    expect(screen.getByRole('button', { name: 'Veloce e facile ⚡' })).toBeTruthy();
  });
});
