// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MealTabs } from '../components/menu/MealTabs';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('MealTabs with breakfast', () => {
  it('shows breakfast, lunch and dinner tabs in order', () => {
    render(
      <LocaleProvider>
        <MealTabs selected="lunch" onSelect={() => undefined} />
      </LocaleProvider>,
    );
    const tabs = screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'));
    expect(tabs).toEqual(['Breakfast', 'Lunch', 'Dinner']);
  });

  it('selects breakfast when its tab is pressed', () => {
    const onSelect = vi.fn();
    render(
      <LocaleProvider>
        <MealTabs selected="lunch" onSelect={onSelect} />
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Breakfast' }));
    expect(onSelect).toHaveBeenCalledWith('breakfast');
  });
});
