// Fetches a recipe through the running dev server (mock mode) and saves it for the local seed.
// Usage: npm run dev:seed [recipe-url]   (the dev server must be running: NEXT_PUBLIC_AUTH_MOCK=true npm run dev)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Each run adds its recipe to the seed file; a recipe whose title is already there is replaced, not duplicated.
const DEFAULT_URL = 'https://ricette.giallozafferano.it/Zuppa-di-zucca-e-lenticchie.html';
const base = process.env.DEV_URL ?? 'http://localhost:3000';
const url = process.argv[2] ?? DEFAULT_URL;

async function post(path, body) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${path} answered ${response.status}: ${await response.text()}`);
  return response;
}

const recipe = await (await post('/api/scrape-recipe', { url })).json();
const entry = {
  title: recipe.title,
  time: '',
  category: 'Dinner',
  label: 'Cozy Winter ❄️',
  ingredients: recipe.ingredients,
  steps: recipe.steps,
};

if (recipe.image) {
  const photo = await post('/api/recipe-image', { url: recipe.image });
  const bytes = Buffer.from(await photo.arrayBuffer());
  entry.photoBase64 = bytes.toString('base64');
  entry.photoType = photo.headers.get('content-type') ?? 'image/jpeg';
}

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'dev', 'seed-recipes.json');
const existing = existsSync(out) ? (JSON.parse(readFileSync(out, 'utf8')).recipes ?? []) : [];
const seed = { recipes: [...existing.filter((saved) => saved.title !== entry.title), entry] };
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed));
console.log(`Saved "${recipe.title}" (${recipe.ingredients.length} ingredients, ${recipe.steps.length} steps); the seed now has ${seed.recipes.length} recipes`);
