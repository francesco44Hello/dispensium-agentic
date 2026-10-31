// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MealTabs } from '../components/menu/MealTabs';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(cleanup);

describe('MealTabs icons', () => {
  it('uses the breakfast, lunch and dinner icons from the shared sprite', () => {
    render(
      <LocaleProvider>
        <MealTabs selected="breakfast" onSelect={vi.fn()} />
      </LocaleProvider>,
    );
    const hrefs = ['Breakfast', 'Lunch', 'Dinner'].map((name) =>
      screen.getByRole('button', { name }).querySelector('use')?.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/icons/sprite.svg#meal-breakfast', '/icons/sprite.svg#meal-lunch', '/icons/sprite.svg#meal-dinner']);
  });
});
