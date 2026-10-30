import type { CategoryMap } from '../types/category';
import { FALLBACK_CATEGORY } from '../constants/categories';

// Lowercase with accents removed, so 'Limón' matches 'limon' and 'crème fraîche' matches 'creme fraiche'.
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

// Words are runs of letters and digits. Apostrophes and hyphens break words: "d'oliva" is 'd' and 'oliva',
// and 'coca-cola' is 'coca' and 'cola'.
function wordsOf(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 0);
}

// An English plural adds 's' or 'es' to a whole word, so 'apples' and 'peaches' match 'apple' and 'peach'.
// Italian and Spanish plurals change the word, so they are listed as keywords of their own.
function sameWord(itemWord: string, keywordWord: string): boolean {
  return itemWord === keywordWord || itemWord === `${keywordWord}s` || itemWord === `${keywordWord}es`;
}

// True when the keyword's words appear in the item as a run of whole words, in order.
function containsPhrase(itemWords: string[], keywordWords: string[]): boolean {
  for (let start = 0; start + keywordWords.length <= itemWords.length; start++) {
    if (keywordWords.every((word, offset) => sameWord(itemWords[start + offset] ?? '', word))) return true;
  }
  return false;
}

const keywordWordCache = new Map<string, string[]>();

function keywordWordsOf(keyword: string): string[] {
  let words = keywordWordCache.get(keyword);
  if (!words) {
    words = wordsOf(fold(keyword));
    keywordWordCache.set(keyword, words);
  }
  return words;
}

// Only whole words match, so 'pesce' (fish) never files 'pesca' (peach), and 'mela' (apple) never files 'melanzane'.
// Typos and Italian stems are not guessed: a word that is not in the map is 'other', so it can be corrected by hand later.
// The longest keyword phrase wins, so 'pesca noce' beats 'pesca'. Ties go to the first category in map order.
export function getCategory(itemName: string, map: CategoryMap): string {
  const itemWords = wordsOf(fold(itemName));
  let best: { category: string; length: number } | null = null;

  for (const [category, keywords] of Object.entries(map)) {
    for (const keyword of keywords) {
      const keywordWords = keywordWordsOf(keyword);
      if (keywordWords.length === 0 || (best && keywordWords.length <= best.length)) continue;
      if (containsPhrase(itemWords, keywordWords)) best = { category, length: keywordWords.length };
    }
  }

  return best?.category ?? FALLBACK_CATEGORY;
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
