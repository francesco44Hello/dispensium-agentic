// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { RecipeDetail } from '../components/recipes/RecipeDetail';
import type { Recipe } from '../types/recipe';

afterEach(cleanup);

const recipe: Recipe = {
  id: 'r1',
  title: 'Carbonara',
  time: '25 min',
  category: 'Dinner',
  label: 'Quick & Easy ⚡',
  ingredients: ['spaghetti', 'eggs'],
  steps: ['Boil the pasta', 'Mix the eggs'],
  image: 'https://example.com/carbonara.jpg',
  createdAt: new Date(0),
  createdBy: 'alice',
};

describe('RecipeDetail', () => {
  it('shows the title, label, time and category', () => {
    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Carbonara' })).toBeInTheDocument();
    expect(screen.getByText('Quick & Easy ⚡')).toBeInTheDocument();
    expect(screen.getByText('25 min')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('lists ingredients and numbers the steps', () => {
    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={vi.fn()} />);
    expect(screen.getByRole('list', { name: 'Ingredients' })).toHaveTextContent('spaghetti');
    expect(screen.getByText('Boil the pasta').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('Mix the eggs').previousSibling).toHaveTextContent('2');
  });

  it('uses the resolved cover image, or the legacy placeholder when there is none', () => {
    const { unmount } = render(<RecipeDetail recipe={recipe} imageUrl="blob:cover" onAddIngredient={vi.fn()} />);
    expect(screen.getByAltText('Carbonara')).toHaveAttribute('src', 'blob:cover');
    unmount();

    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={vi.fn()} />);
    expect(screen.getByAltText('Carbonara')).toHaveAttribute('src', '/fruit-login.jpg');
  });

  it('shows dashes for missing time and category', () => {
    render(<RecipeDetail recipe={{ ...recipe, time: '', category: '' }} imageUrl="" onAddIngredient={vi.fn()} />);
    expect(screen.getAllByText('--')).toHaveLength(2);
  });

  it('links back to the recipes list', () => {
    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Back to recipes' })).toHaveAttribute('href', '/recipes');
  });

  it('adds an ingredient to the shopping list from its cart button', async () => {
    const onAddIngredient = vi.fn(async () => undefined);
    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={onAddIngredient} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add spaghetti to shopping list' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Added spaghetti to shopping list' })).toBeDisabled());
    expect(onAddIngredient).toHaveBeenCalledWith('spaghetti');
  });

  it('reports a failed add and keeps the cart button usable', async () => {
    const onAddIngredient = vi.fn(async () => {
      throw new Error('offline');
    });
    render(<RecipeDetail recipe={recipe} imageUrl="" onAddIngredient={onAddIngredient} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add eggs to shopping list' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not add eggs');
    expect(screen.getByRole('button', { name: 'Add eggs to shopping list' })).toBeEnabled();
  });
});
