// Fetches a recipe through the running dev server (mock mode) and saves it for the local seed.
// Usage: npm run dev:seed [recipe-url]   (the dev server must be running: NEXT_PUBLIC_AUTH_MOCK=true npm run dev)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const seed = {
  recipes: [
    {
      title: recipe.title,
      time: '',
      category: 'Dinner',
      label: 'Cozy Winter ❄️',
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    },
  ],
};

if (recipe.image) {
  const photo = await post('/api/recipe-image', { url: recipe.image });
  const bytes = Buffer.from(await photo.arrayBuffer());
  seed.recipes[0].photoBase64 = bytes.toString('base64');
  seed.recipes[0].photoType = photo.headers.get('content-type') ?? 'image/jpeg';
}

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'dev', 'seed-recipes.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed));
console.log(`Saved "${recipe.title}" (${recipe.ingredients.length} ingredients, ${recipe.steps.length} steps) to public/dev/seed-recipes.json`);
