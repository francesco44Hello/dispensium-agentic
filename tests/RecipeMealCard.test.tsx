// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const { photo } = vi.hoisted(() => ({ photo: { url: '' } }));
vi.mock('../hooks/useRecipePhoto', () => ({ useRecipePhoto: () => photo.url }));

import { RecipeMealCard } from '../components/menu/RecipeMealCard';
import type { Recipe } from '../types/recipe';

afterEach(() => {
  cleanup();
  photo.url = '';
});

const recipe: Recipe = {
  id: 'r9',
  title: 'Pancakes',
  time: '15 min',
  category: 'Breakfast',
  label: 'Quick & Easy ⚡',
  ingredients: ['flour'],
  steps: ['Fry'],
  image: 'households/hh-1/recipes/p.webp',
  createdAt: new Date(0),
  createdBy: 'alice',
};

describe('RecipeMealCard', () => {
  it('links to the recipe page with its title and time', () => {
    render(<RecipeMealCard recipe={recipe} />);
    const link = screen.getByRole('link', { name: /Pancakes/ });
    expect(link).toHaveAttribute('href', '/recipes/r9');
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('shows the recipe photo once it has loaded', () => {
    photo.url = 'blob:photo';
    render(<RecipeMealCard recipe={recipe} />);
    expect(screen.getByAltText('Pancakes')).toHaveAttribute('src', 'blob:photo');
  });

  it('shows the legacy placeholder while the photo is loading or missing', () => {
    render(<RecipeMealCard recipe={recipe} />);
    expect(screen.getByAltText('Pancakes')).toHaveAttribute('src', '/fruit-login.jpg');
  });
});
