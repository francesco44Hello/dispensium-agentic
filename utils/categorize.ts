import type { CategoryMap } from '../types/category';
import { FALLBACK_CATEGORY } from '../constants/categories';

// A keyword must start a word: 'ham' is not in 'champagne' and 'oat' is not in 'goat'. Any ending is allowed,
// so plurals such as 'apples' still match 'apple'. Apostrophes count as word breaks, so "d'oliva" matches 'oliva'.
const keywordPatterns = new Map<string, RegExp>();

function patternFor(keyword: string): RegExp {
  const key = keyword.toLowerCase();
  let pattern = keywordPatterns.get(key);
  if (!pattern) {
    pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u');
    keywordPatterns.set(key, pattern);
  }
  return pattern;
}

export function getCategory(itemName: string, map: CategoryMap): string {
  const lowerItem = itemName.toLowerCase().trim();
  if (!lowerItem) return FALLBACK_CATEGORY;

  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => patternFor(keyword).test(lowerItem))) {
      return category;
    }
  }
  return FALLBACK_CATEGORY;
}

// Households keep a copy of the keywords from when they were created, and rules forbid editing it.
// Merging the current defaults in keeps new keywords working for them, without writing anything.
export function mergeCategoryMaps(defaults: CategoryMap, stored: CategoryMap | null): CategoryMap {
  const defaultNames = Object.keys(defaults);
  const storedOnly = Object.keys(stored ?? {}).filter((category) => !defaultNames.includes(category));
  const merged: CategoryMap = {};
  for (const category of [...defaultNames, ...storedOnly]) {
    merged[category] = unique([...(defaults[category] ?? []), ...(stored?.[category] ?? [])]);
  }
  return merged;
}

// Keeps the first spelling of each keyword, so 'Milk' and 'milk' are the same keyword.
function unique(keywords: string[]): string[] {
  const seen = new Set<string>();
  return keywords.filter((keyword) => {
    const key = keyword.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
