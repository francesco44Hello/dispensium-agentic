// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { Recipe } from '../types/recipe';

const { recipes } = vi.hoisted(() => {
  const make = (id: string, label: string) => ({
    id,
    title: id,
    time: '',
    category: 'Dinner',
    label,
    ingredients: [],
    steps: [],
    image: '',
    createdAt: new Date(0),
    createdBy: 'alice',
  });
  return {
    recipes: [make('soup', 'Cozy Winter ❄️'), make('pasta', 'Quick & Easy ⚡')] as Recipe[],
  };
});

vi.mock('../hooks/useHousehold', () => ({
  useHousehold: () => ({ status: 'ready', householdId: 'hh-1', error: null }),
}));
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'alice' } }),
}));
vi.mock('../components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../services/dataClient', () => ({
  recipeService: { subscribeToRecipes: (_hid: string, listener: (list: Recipe[]) => void) => { listener(recipes); return () => undefined; } },
}));
vi.mock('../components/recipes/RecipeList', () => ({
  RecipeList: ({ recipes: shown }: { recipes: Recipe[] }) => (
    <ul>
      {shown.map((recipe) => (
        <li key={recipe.id}>{recipe.id}</li>
      ))}
    </ul>
  ),
}));
vi.mock('../components/recipes/RecipeSheet', () => ({ RecipeSheet: () => null }));

import { RecipesScreen } from '../components/recipes/RecipesScreen';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('RecipesScreen label filter', () => {
  it('shows every label as a chip, with All selected at first', () => {
    render(<RecipesScreen />);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Quick & Easy ⚡' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Summer Fresh ☀️' })).toBeInTheDocument();
  });

  it('shows only the recipes with the chosen label', () => {
    render(<RecipesScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick & Easy ⚡' }));
    expect(screen.getByRole('button', { name: 'Quick & Easy ⚡' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('listitem')).toHaveTextContent('pasta');
    expect(screen.queryByText('soup')).toBeNull();
  });

  it('goes back to every recipe when All is chosen again', () => {
    render(<RecipesScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick & Easy ⚡' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('says so when no recipe has the chosen label', () => {
    render(<RecipesScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Comfort Food 🥣' }));
    expect(screen.getByText('No recipes with this label.')).toBeInTheDocument();
  });
});
