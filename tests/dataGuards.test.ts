import { describe, it, expect } from 'vitest';
import { isCategoryMap, isPartialDayMenu, isSeedFile } from '../utils/dataGuards';

const entry = { main: 'Pasta', side: '', mainRecipeId: '', sideRecipeId: '' };

describe('isCategoryMap', () => {
  it('accepts a map of category names to lists of words', () => {
    expect(isCategoryMap({ fruits: ['apple'], other: [] })).toBe(true);
    expect(isCategoryMap({})).toBe(true);
  });

  it('rejects non-objects, arrays and null', () => {
    expect(isCategoryMap(null)).toBe(false);
    expect(isCategoryMap('fruits')).toBe(false);
    expect(isCategoryMap(['apple'])).toBe(false);
    expect(isCategoryMap(undefined)).toBe(false);
  });

  it('rejects a category whose words are not all strings', () => {
    expect(isCategoryMap({ fruits: 'apple' })).toBe(false);
    expect(isCategoryMap({ fruits: ['apple', 3] })).toBe(false);
    expect(isCategoryMap({ fruits: null })).toBe(false);
  });
});

describe('isPartialDayMenu', () => {
  it('accepts a day with either or both meals, and an empty object', () => {
    expect(isPartialDayMenu({})).toBe(true);
    expect(isPartialDayMenu({ lunch: entry })).toBe(true);
    expect(isPartialDayMenu({ lunch: entry, dinner: entry })).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isPartialDayMenu(null)).toBe(false);
    expect(isPartialDayMenu('lunch')).toBe(false);
    expect(isPartialDayMenu([entry])).toBe(false);
  });

  it('rejects a meal that is missing a field or has a non-string field', () => {
    expect(isPartialDayMenu({ lunch: { main: 'Pasta' } })).toBe(false);
    expect(isPartialDayMenu({ dinner: { ...entry, side: 5 } })).toBe(false);
    expect(isPartialDayMenu({ lunch: 'Pasta' })).toBe(false);
  });
});

describe('isSeedFile', () => {
  const recipe = {
    title: 'Soup',
    time: '20 min',
    category: 'Dinner',
    label: 'Quick & Easy ⚡',
    ingredients: ['water'],
    steps: ['Boil'],
  };

  it('accepts a seed file with recipes, with or without photos', () => {
    expect(isSeedFile({ recipes: [] })).toBe(true);
    expect(isSeedFile({ recipes: [recipe] })).toBe(true);
    expect(isSeedFile({ recipes: [{ ...recipe, photoBase64: 'AAAA', photoType: 'image/webp' }] })).toBe(true);
  });

  it('rejects a missing recipes list or a non-object file', () => {
    expect(isSeedFile(null)).toBe(false);
    expect(isSeedFile({})).toBe(false);
    expect(isSeedFile({ recipes: 'soup' })).toBe(false);
  });

  it('rejects a recipe with a missing or wrongly typed field', () => {
    expect(isSeedFile({ recipes: [{ ...recipe, title: undefined }] })).toBe(false);
    expect(isSeedFile({ recipes: [{ ...recipe, ingredients: 'water' }] })).toBe(false);
    expect(isSeedFile({ recipes: [{ ...recipe, steps: [1] }] })).toBe(false);
    expect(isSeedFile({ recipes: [{ ...recipe, photoBase64: 12 }] })).toBe(false);
  });
});
