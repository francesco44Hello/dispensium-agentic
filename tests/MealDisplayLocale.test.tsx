// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MealDisplay } from '../components/menu/MealDisplay';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { EMPTY_MEAL } from '../types/menu';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.setItem('dispensium-locale', 'it');
});

describe('MealDisplay in Italian', () => {
  it('translates the empty-meal prompt and the edit button', async () => {
    render(
      <LocaleProvider>
        <MealDisplay meal="lunch" entry={EMPTY_MEAL} recipes={[]} onEdit={() => undefined} />
      </LocaleProvider>,
    );
    expect(await screen.findByText('Tocca per aggiungere Pranzo')).toBeTruthy();
    expect(screen.queryByText(/Tap to add/)).toBeNull();
  });
});
