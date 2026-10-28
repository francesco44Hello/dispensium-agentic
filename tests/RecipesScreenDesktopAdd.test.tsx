// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('../hooks/useHousehold', () => ({
  useHousehold: () => ({ status: 'ready', householdId: 'hh-1', error: null }),
}));
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'alice' } }),
}));
vi.mock('../components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../services/dataClient', () => ({
  recipeService: { subscribeToRecipes: () => () => undefined },
}));
vi.mock('../components/recipes/RecipeList', () => ({ RecipeList: () => null }));
vi.mock('../components/recipes/RecipeSheet', () => ({
  RecipeSheet: ({ open }: { open: boolean }) => <p>{open ? 'sheet open' : 'sheet closed'}</p>,
}));

import { RecipesScreen } from '../components/recipes/RecipesScreen';

afterEach(() => {
  cleanup();
});

describe('RecipesScreen add button on the page', () => {
  it('shows an add recipe link in the page that opens the full-page form', () => {
    render(<RecipesScreen />);
    expect(screen.getByText('sheet closed')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Add recipe' })).toHaveAttribute('href', '/recipes/new');
  });
});
