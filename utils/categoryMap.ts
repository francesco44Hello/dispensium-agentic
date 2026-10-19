import type { CategoryMap } from '../types/category';

// Both helpers return a new map and never mutate the input.

export function addWord(map: CategoryMap, category: string, word: string): CategoryMap {
  const normalized = word.trim().toLowerCase();
  const existing = map[category];
  if (!normalized || !existing || existing.includes(normalized)) return map;

  return { ...map, [category]: [...existing, normalized] };
}

export function removeWord(map: CategoryMap, category: string, word: string): CategoryMap {
  const existing = map[category];
  if (!existing || !existing.includes(word)) return map;

  return { ...map, [category]: existing.filter((entry) => entry !== word) };
}
