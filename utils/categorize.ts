import type { CategoryMap } from '../types/category';
import { FALLBACK_CATEGORY } from '../constants/categories';

export function getCategory(itemName: string, map: CategoryMap): string {
  const lowerItem = itemName.toLowerCase().trim();
  if (!lowerItem) return FALLBACK_CATEGORY;

  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => lowerItem.includes(keyword))) {
      return category;
    }
  }
  return FALLBACK_CATEGORY;
}
