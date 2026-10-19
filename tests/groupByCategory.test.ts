import { describe, it, expect } from 'vitest';
import { groupByCategory } from '../utils/groupByCategory';
import type { GroceryItem } from '../types/grocery';

const item = (id: string, category: string): GroceryItem => ({
  id,
  name: id,
  category,
  completed: false,
  createdAt: new Date(0),
  createdBy: 'alice',
});

describe('groupByCategory', () => {
  it('groups items by category in order of first appearance', () => {
    const groups = groupByCategory([item('milk', 'dairy'), item('apple', 'fruits'), item('cheese', 'dairy')]);
    expect(groups.map((g) => g.category)).toEqual(['dairy', 'fruits']);
  });

  it('keeps the original order of items within a group', () => {
    const groups = groupByCategory([item('milk', 'dairy'), item('cheese', 'dairy')]);
    expect(groups[0].items.map((i) => i.id)).toEqual(['milk', 'cheese']);
  });

  it('returns an empty array for no items', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});
