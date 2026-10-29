import { describe, it, expect } from 'vitest';
import { filterRecipesByLabel } from '../utils/recipeFilter';
import type { Recipe } from '../types/recipe';

const recipe = (id: string, label: string): Recipe => ({
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

const recipes = [
  recipe('soup', 'Cozy Winter ❄️'),
  recipe('salad', 'Summer Fresh ☀️'),
  recipe('pasta', 'Quick & Easy ⚡'),
  recipe('plain', ''),
];

describe('filterRecipesByLabel', () => {
  it('returns every recipe when no label is chosen', () => {
    expect(filterRecipesByLabel(recipes, null).map((r) => r.id)).toEqual(['soup', 'salad', 'pasta', 'plain']);
  });

  it('keeps only the recipes with the chosen label', () => {
    expect(filterRecipesByLabel(recipes, 'Quick & Easy ⚡').map((r) => r.id)).toEqual(['pasta']);
  });

  it('keeps the original order', () => {
    const twoWinter = [recipe('b', 'Cozy Winter ❄️'), recipe('a', 'Summer Fresh ☀️'), recipe('c', 'Cozy Winter ❄️')];
    expect(filterRecipesByLabel(twoWinter, 'Cozy Winter ❄️').map((r) => r.id)).toEqual(['b', 'c']);
  });

  it('leaves out recipes that have no label', () => {
    expect(filterRecipesByLabel(recipes, 'Summer Fresh ☀️').map((r) => r.id)).toEqual(['salad']);
    expect(filterRecipesByLabel(recipes, null).map((r) => r.id)).toContain('plain');
  });

  it('returns an empty list when no recipe has the label', () => {
    expect(filterRecipesByLabel([recipe('soup', 'Cozy Winter ❄️')], 'Comfort Food 🥣')).toEqual([]);
  });

  it('does not change the list it is given', () => {
    const copy = [...recipes];
    filterRecipesByLabel(recipes, 'Cozy Winter ❄️');
    expect(recipes).toEqual(copy);
  });
});
