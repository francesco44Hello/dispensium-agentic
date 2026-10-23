// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MealEditForm } from '../components/menu/MealEditForm';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { EMPTY_MEAL } from '../types/menu';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.setItem('dispensium-locale', 'it');
});

describe('MealEditForm in Italian', () => {
  it('translates the cancel and save buttons', async () => {
    render(
      <LocaleProvider>
        <MealEditForm entry={EMPTY_MEAL} recipes={[]} onSave={() => undefined} onCancel={() => undefined} />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('button', { name: 'Annulla' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salva' })).toBeTruthy();
  });
});
