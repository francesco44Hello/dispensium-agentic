import { describe, it, expect } from 'vitest';
import { addWord, removeWord } from '../utils/categoryMap';
import type { CategoryMap } from '../types/category';

const base = (): CategoryMap => ({ fruits: ['apple'], dairy: ['milk'] });

describe('addWord', () => {
  it('adds a normalised word to the category', () => {
    const next = addWord(base(), 'fruits', '  Banana ');
    expect(next.fruits).toEqual(['apple', 'banana']);
  });

  it('does not mutate the original map', () => {
    const original = base();
    addWord(original, 'fruits', 'banana');
    expect(original).toEqual(base());
  });

  it('returns an equal map when the word already exists', () => {
    expect(addWord(base(), 'fruits', 'APPLE')).toEqual(base());
  });

  it('returns an equal map for an empty or whitespace word', () => {
    expect(addWord(base(), 'fruits', '   ')).toEqual(base());
  });

  it('returns an equal map for an unknown category', () => {
    expect(addWord(base(), 'gadgets', 'phone')).toEqual(base());
  });
});

describe('removeWord', () => {
  it('removes only the matching word', () => {
    const map: CategoryMap = { fruits: ['apple', 'pear'] };
    expect(removeWord(map, 'fruits', 'apple')).toEqual({ fruits: ['pear'] });
  });

  it('does not mutate the original map', () => {
    const original: CategoryMap = { fruits: ['apple', 'pear'] };
    removeWord(original, 'fruits', 'apple');
    expect(original).toEqual({ fruits: ['apple', 'pear'] });
  });

  it('returns an equal map when the word is absent', () => {
    expect(removeWord(base(), 'fruits', 'kiwi')).toEqual(base());
  });

  it('returns an equal map for an unknown category', () => {
    expect(removeWord(base(), 'gadgets', 'apple')).toEqual(base());
  });
});
