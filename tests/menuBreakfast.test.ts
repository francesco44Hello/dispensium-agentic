import { describe, it, expect } from 'vitest';
import { MEALS, emptyDay, isMealType } from '../types/menu';

describe('menu meals', () => {
  it('has breakfast, lunch and dinner in day order', () => {
    expect(MEALS).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('starts every day with an empty breakfast', () => {
    expect(emptyDay().breakfast.main).toBe('');
  });

  it('accepts breakfast and rejects other names', () => {
    expect(isMealType('breakfast')).toBe(true);
    expect(isMealType('brunch')).toBe(false);
  });
});
