import { describe, it, expect } from 'vitest';
import { editDistance } from '../utils/editDistance';

describe('editDistance', () => {
  it.each([
    ['milk', 'milk', 0],
    ['gorgonzolla', 'gorgonzola', 1],
    ['cheese', 'chese', 1],
    ['milk', 'mlik', 1],
    ['cat', 'dog', 3],
    ['', 'abc', 3],
    ['abc', '', 3],
  ])('the distance between %j and %j is %i', (a, b, expected) => {
    expect(editDistance(a, b)).toBe(expected);
  });

  it('is symmetric', () => {
    expect(editDistance('mozarella', 'mozzarella')).toBe(editDistance('mozzarella', 'mozarella'));
  });
});
