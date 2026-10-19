import type { GroceryItem } from '../types/grocery';

export interface CategoryGroup {
  category: string;
  items: GroceryItem[];
}

// Groups preserve the order in which each category first appears, as the legacy list did.
export function groupByCategory(items: GroceryItem[]): CategoryGroup[] {
  const groups = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return [...groups].map(([category, groupItems]) => ({ category, items: groupItems }));
}
