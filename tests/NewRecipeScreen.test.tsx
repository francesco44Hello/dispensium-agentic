// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/recipes/new', useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('../hooks/useHousehold', () => ({
  useHousehold: () => ({ status: 'ready', householdId: 'hh-1', error: null }),
}));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'alice' } }) }));
vi.mock('../services/dataClient', () => ({ recipeService: { addRecipe: vi.fn() } }));
vi.mock('../components/recipes/RecipeEditor', () => ({ RecipeEditor: () => <p>editor</p> }));

import { NewRecipeScreen } from '../components/recipes/NewRecipeScreen';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  push.mockClear();
});

describe('NewRecipeScreen', () => {
  it('is a full page with the recipe editor and a way back, and no bottom navigation', () => {
    render(
      <LocaleProvider>
        <NewRecipeScreen />
      </LocaleProvider>,
    );
    expect(screen.getByText('editor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to recipes/ })).toHaveAttribute('href', '/recipes');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
