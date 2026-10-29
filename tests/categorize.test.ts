import { describe, it, expect } from 'vitest';
import { getCategory, mergeCategoryMaps } from '../utils/categorize';
import { defaultCategoryMap } from '../constants/categories';
import type { CategoryMap } from '../types/category';

describe('getCategory', () => {
  it('categorises an English item using the default map', () => {
    expect(getCategory('apple', defaultCategoryMap)).toBe('fruits');
  });

  it('categorises an Italian item using the default map', () => {
    expect(getCategory('latte', defaultCategoryMap)).toBe('dairy');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(getCategory('  MILK ', defaultCategoryMap)).toBe('dairy');
  });

  it('matches a keyword inside a longer item name', () => {
    expect(getCategory('whole milk', defaultCategoryMap)).toBe('dairy');
  });

  it('returns "other" for an unknown item', () => {
    expect(getCategory('unobtainium', defaultCategoryMap)).toBe('other');
  });

  it('returns "other" for an empty string', () => {
    expect(getCategory('', defaultCategoryMap)).toBe('other');
  });

  it('returns the first matching category in map order', () => {
    const map: CategoryMap = { first: ['x'], second: ['x'] };
    expect(getCategory('x', map)).toBe('first');
  });

  it('uses the map it is given, not the default map', () => {
    const map: CategoryMap = { gadgets: ['phone'] };
    expect(getCategory('phone', map)).toBe('gadgets');
    expect(getCategory('apple', map)).toBe('other');
  });
});

describe('mergeCategoryMaps', () => {
  const defaults: CategoryMap = { fruits: ['apple'], dairy: ['milk', 'cheese'] };

  it('returns the defaults when a household has no stored map', () => {
    expect(mergeCategoryMaps(defaults, null)).toEqual(defaults);
  });

  it('adds current default keywords to an older stored map', () => {
    const stored: CategoryMap = { dairy: ['milk'] };
    expect(mergeCategoryMaps(defaults, stored).dairy).toEqual(['milk', 'cheese']);
  });

  it('keeps a category that only the stored map has, after the defaults', () => {
    const stored: CategoryMap = { dairy: ['milk'], gadgets: ['phone'] };
    expect(Object.keys(mergeCategoryMaps(defaults, stored))).toEqual(['fruits', 'dairy', 'gadgets']);
    expect(getCategory('phone', mergeCategoryMaps(defaults, stored))).toBe('gadgets');
  });

  it('dedupes keywords regardless of case', () => {
    const stored: CategoryMap = { dairy: ['Milk', 'cream'] };
    expect(mergeCategoryMaps({ dairy: ['milk'] }, stored).dairy).toEqual(['milk', 'cream']);
  });

  it('does not change either map it is given', () => {
    const stored: CategoryMap = { dairy: ['milk'] };
    mergeCategoryMaps(defaults, stored);
    expect(stored).toEqual({ dairy: ['milk'] });
    expect(defaults.dairy).toEqual(['milk', 'cheese']);
  });
});

describe('keyword coverage for common unlisted foods', () => {
  it.each([
    ['mature cheddar', 'dairy'],
    ['Parmesan', 'dairy'],
    ['Feta', 'dairy'],
    ['Mascarpone', 'dairy'],
    ['vegetable stock', 'pantry'],
    ['ground cumin', 'pantry'],
    ['Scalogno', 'vegetables'],
    ['fresh coriander', 'vegetables'],
    ['prezzemolo', 'vegetables'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});

describe('matching at the start of a word', () => {
  it.each([
    ['champagne', 'drinks'],
    ['goat', 'other'],
    ['apples', 'fruits'],
    ["d'oliva", 'other'],
    ['whole milk', 'dairy'],
  ])('files %j under %s', (item, category) => {
    expect(getCategory(item, defaultCategoryMap)).toBe(category);
  });
});
