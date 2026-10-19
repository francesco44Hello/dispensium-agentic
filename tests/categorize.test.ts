import { describe, it, expect } from 'vitest';
import { getCategory } from '../utils/categorize';
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
