import type { CategoryMap } from '../types/category';
import { FALLBACK_CATEGORY } from '../constants/categories';
import { editDistance } from './editDistance';

// Lowercase with accents removed, so 'Limón' matches 'limon' and 'crème fraîche' matches 'creme fraiche'.
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

// A keyword must start a word: 'ham' is not in 'champagne' and 'oat' is not in 'goat'. Any ending is allowed,
// so plurals such as 'apples' still match 'apple'. Apostrophes count as word breaks, so "d'oliva" matches 'oliva'.
// A keyword ending in '$' must be the whole word, so 'limón$' matches 'limón' but not 'limonada'.
const keywordPatterns = new Map<string, RegExp>();

function patternFor(keyword: string): RegExp {
  let pattern = keywordPatterns.get(keyword);
  if (!pattern) {
    const wholeWord = keyword.endsWith('$');
    const body = keyword.replace(/\$$/u, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${body}${wholeWord ? '(?![\\p{L}\\p{N}])' : ''}`, 'u');
    keywordPatterns.set(keyword, pattern);
  }
  return pattern;
}

// Italian and Spanish plurals change the last vowel: 'pomodoro' is 'pomodori', 'mozzarella' is 'mozzarelle'.
// The keyword without its last vowel, followed by one vowel and the end of the word, covers both. The end
// check stops 'pesca' from reaching 'pescado' and 'leche' from reaching 'lechuga'. Stems under four letters are too loose.
const stemPatterns = new Map<string, RegExp>();

function stemPatternFor(keyword: string): RegExp | null {
  if (keyword.length < 5 || !/[aeio]$/u.test(keyword)) return null;
  const stem = keyword.slice(0, -1);
  if (stem.length < 4) return null;
  let pattern = stemPatterns.get(stem);
  if (!pattern) {
    pattern = new RegExp(`${patternFor(stem).source}[aeio](?![\\p{L}\\p{N}])`, 'u');
    stemPatterns.set(stem, pattern);
  }
  return pattern;
}

function firstCategory(map: CategoryMap, matches: (keyword: string) => boolean): string | null {
  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => matches(fold(keyword)))) return category;
  }
  return null;
}

// Corrects one typo in a word of six letters or more. The first letter must match, because typos rarely hit it,
// so 'beach' does not become 'peach'. Two typos are allowed only for words of nine letters or more.
function categoryOfClosestTypo(item: string, map: CategoryMap): string | null {
  let best: { category: string; distance: number } | null = null;
  for (const word of item.split(/[^\p{L}]+/u)) {
    if (word.length < 6) continue;
    for (const [category, keywords] of Object.entries(map)) {
      for (const keyword of keywords) {
        const candidate = fold(keyword);
        if (candidate.length < 6 || !/^\p{L}+$/u.test(candidate) || candidate[0] !== word[0]) continue;
        const distance = editDistance(word, candidate);
        const allowed = Math.min(word.length, candidate.length) >= 9 ? 2 : 1;
        if (distance <= allowed && (!best || distance < best.distance)) best = { category, distance };
      }
    }
  }
  return best?.category ?? null;
}

// Each pass runs only when the one before it found nothing, so an exact keyword always wins over a looser guess.
export function getCategory(itemName: string, map: CategoryMap): string {
  const item = fold(itemName);
  if (!item) return FALLBACK_CATEGORY;

  return (
    firstCategory(map, (keyword) => patternFor(keyword).test(item)) ??
    firstCategory(map, (keyword) => stemPatternFor(keyword)?.test(item) ?? false) ??
    categoryOfClosestTypo(item, map) ??
    FALLBACK_CATEGORY
  );
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
