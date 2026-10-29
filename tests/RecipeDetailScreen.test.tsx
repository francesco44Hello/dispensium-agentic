// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import type { Recipe } from '../types/recipe';

const { replace, deleteRecipe, addItem, updateRecipe } = vi.hoisted(() => ({
  replace: vi.fn(),
  deleteRecipe: vi.fn(),
  addItem: vi.fn(),
  updateRecipe: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('../components/AppShell', () => ({ AppShell: ({ children }: { children: unknown }) => children }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'alice' } }) }));
vi.mock('../hooks/useHousehold', () => ({ useHousehold: () => ({ status: 'ready', householdId: 'hh-1', error: null }) }));
vi.mock('../hooks/useRecipePhoto', () => ({ useRecipePhoto: () => '' }));

const recipe: Recipe = {
  id: 'r1',
  title: 'Carbonara',
  time: '25 min',
  category: 'Dinner',
  label: 'Quick & Easy ⚡',
  ingredients: ['spaghetti', '60g/2¼oz mature cheddar, grated'],
  steps: ['Boil the pasta'],
  image: 'households/hh-1/recipes/p1.webp',
  createdAt: new Date(0),
  createdBy: 'alice',
};

vi.mock('../services/dataClient', () => ({
  recipeService: {
    subscribeToRecipes: (_hid: string, listener: (recipes: Recipe[]) => void) => {
      listener([recipe]);
      return () => undefined;
    },
    deleteRecipe,
    updateRecipe,
  },
  groceryService: { addItem },
}));

import { RecipeDetailScreen } from '../components/recipes/RecipeDetailScreen';

afterEach(() => {
  cleanup();
  replace.mockReset();
  deleteRecipe.mockReset();
  addItem.mockReset();
  updateRecipe.mockReset();
});

function deleteFromPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete recipe' }));
  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
}

describe('RecipeDetailScreen delete', () => {
  it('deletes the recipe with its photo path, then returns to the recipes list', async () => {
    deleteRecipe.mockResolvedValue(undefined);
    render(<RecipeDetailScreen id="r1" />);
    deleteFromPage();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/recipes'));
    expect(deleteRecipe).toHaveBeenCalledWith('hh-1', 'r1', 'households/hh-1/recipes/p1.webp');
  });

  it('stays on the recipe and shows the error when the delete fails', async () => {
    deleteRecipe.mockRejectedValue(new Error('denied'));
    render(<RecipeDetailScreen id="r1" />);
    deleteFromPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the recipe. Try again.');
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'Carbonara' })).toBeInTheDocument();
  });
});

describe('RecipeDetailScreen shopping list', () => {
  it('adds the cleaned ingredient name, and the cart button still tracks the raw line', async () => {
    addItem.mockResolvedValue(undefined);
    render(<RecipeDetailScreen id="r1" />);
    const cart = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-label')?.includes('mature cheddar'));
    expect(cart).toBeDefined();
    fireEvent.click(cart as HTMLElement);
    await waitFor(() => expect(addItem).toHaveBeenCalledWith('hh-1', 'alice', 'mature cheddar'));
    await waitFor(() => expect(cart).toBeDisabled());
  });
});

describe('RecipeDetailScreen edit', () => {
  it('saves an edit with the recipe photo path it already has, and the edited text', async () => {
    updateRecipe.mockResolvedValue(undefined);
    render(<RecipeDetailScreen id="r1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit recipe' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Recipe title' }), { target: { value: 'Carbonara 2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(updateRecipe).toHaveBeenCalledOnce());
    const [householdId, id, currentImage, draft, change] = updateRecipe.mock.calls[0];
    expect([householdId, id, currentImage]).toEqual(['hh-1', 'r1', 'households/hh-1/recipes/p1.webp']);
    expect(draft.title).toBe('Carbonara 2');
    expect(change).toEqual({ kind: 'keep' });
  });
});

