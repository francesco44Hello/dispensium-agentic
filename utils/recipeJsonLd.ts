// Reads the schema.org Recipe block that most recipe sites publish as JSON-LD.
import type { ExtractedRecipe } from '../types/recipe';

type Json = Record<string, unknown>;

const SCRIPT_OPEN = '<script';
const SCRIPT_CLOSE = '</script>';
const LD_JSON_TYPE = /type\s*=\s*["']?application\/ld\+json/;
// Real recipe data nests a few levels. Deeper structures are refused, so hostile pages cannot exhaust the stack.
const MAX_DEPTH = 50;

// Scans for script blocks with indexOf instead of a regex: every block is consumed once, so a hostile page
// with thousands of unclosed tags cannot make the scan quadratic.
export function extractRecipe(html: string): ExtractedRecipe | null {
  const lower = html.toLowerCase();
  let position = 0;
  for (;;) {
    const open = lower.indexOf(SCRIPT_OPEN, position);
    if (open === -1) break;
    const tagEnd = html.indexOf('>', open);
    if (tagEnd === -1) break;
    const close = lower.indexOf(SCRIPT_CLOSE, tagEnd);
    if (close === -1) break;
    position = close + SCRIPT_CLOSE.length;

    if (!LD_JSON_TYPE.test(lower.slice(open, tagEnd))) continue;
    let json: unknown;
    try {
      json = JSON.parse(html.slice(tagEnd + 1, close));
    } catch {
      continue; // Some sites ship broken JSON-LD. Other blocks may still hold the recipe.
    }
    const recipe = findRecipe(json, 0);
    if (recipe) return toRecipe(recipe);
  }
  return null;
}

function isJsonObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findRecipe(node: unknown, depth: number): Json | null {
  if (depth > MAX_DEPTH) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isJsonObject(node)) return null;

  const type = node['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return node;
  return node['@graph'] ? findRecipe(node['@graph'], depth + 1) : null;
}

function toRecipe(recipe: Json): ExtractedRecipe {
  return {
    title: typeof recipe.name === 'string' ? recipe.name : '',
    ingredients: strings(recipe.recipeIngredient),
    steps: steps(recipe.recipeInstructions, 0),
    image: httpsOnly(imageUrl(recipe.image, 0)),
  };
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

// Instructions come as plain strings, HowToStep objects, or HowToSection objects that wrap more steps.
function steps(value: unknown, depth: number): string[] {
  if (depth > MAX_DEPTH) return [];
  if (typeof value === 'string') return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): string[] => {
    if (typeof entry === 'string') return [entry];
    if (!isJsonObject(entry)) return [];
    if (Array.isArray(entry.itemListElement)) return steps(entry.itemListElement, depth + 1);
    return typeof entry.text === 'string' ? [entry.text] : [];
  });
}

// Only https images are kept, so the preview never loads plain http or mixed content.
function httpsOnly(url: string): string {
  return url.startsWith('https://') ? url : '';
}

function imageUrl(value: unknown, depth: number): string {
  if (depth > MAX_DEPTH) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.length > 0 ? imageUrl(value[0], depth + 1) : '';
  if (isJsonObject(value) && typeof value.url === 'string') return value.url;
  return '';
}
