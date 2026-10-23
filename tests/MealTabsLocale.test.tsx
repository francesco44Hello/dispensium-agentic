// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MealTabs } from '../components/menu/MealTabs';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.setItem('dispensium-locale', 'it');
});

describe('MealTabs in Italian', () => {
  it('shows the lunch and dinner tabs in Italian', async () => {
    render(
      <LocaleProvider>
        <MealTabs selected="lunch" onSelect={() => undefined} />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('button', { name: 'Pranzo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cena' })).toBeTruthy();
  });
});
