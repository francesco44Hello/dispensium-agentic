// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../services/authClient', () => ({ currentIdToken: vi.fn(async () => 'token') }));

import { RecipeEditor } from '../components/recipes/RecipeEditor';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('RecipeEditor layout', () => {
  it('keeps the import link panel and the form in one layout, so desktop can place them side by side', () => {
    const { container } = render(
      <LocaleProvider>
        <RecipeEditor onSave={() => undefined} />
      </LocaleProvider>,
    );
    const layout = container.firstChild as HTMLElement;
    expect(layout.className).toMatch(/layout/);
    expect(layout).toContainElement(screen.getByRole('region'));
    expect(layout.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
