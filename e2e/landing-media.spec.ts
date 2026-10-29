import { mkdirSync, readFileSync } from 'node:fs';
import { test, expect } from './fixtures';
import { visibleForm } from './helpers';

// Regenerates the landing page media: app screenshots and the demo video in public/landing/, plus review shots.
// Mock backend only, like every e2e spec. The recipes come from the local dev seed (public/dev/seed-recipes.json,
// written by `npm run dev:seed`), so the captures show real photos. Run with:
// CAPTURE_LANDING=1 CAPTURE_VIDEO=1 npx playwright test e2e/landing-media.spec.ts
const enabled = !!process.env.CAPTURE_LANDING;
const OUT = 'public/landing';
const PAUSE = 900;

const PHONE = { width: 390, height: 844 };

// The seed titles, looked up by their start so the spec does not depend on the exact wording.
function seededTitle(start: string): string {
  const seed: unknown = JSON.parse(readFileSync('public/dev/seed-recipes.json', 'utf8'));
  const recipes = seed !== null && typeof seed === 'object' && 'recipes' in seed && Array.isArray(seed.recipes) ? seed.recipes : [];
  const titles = recipes.filter((recipe): recipe is { title: string } => typeof recipe?.title === 'string');
  const found = titles.find((recipe) => recipe.title.startsWith(start));
  if (!found) throw new Error(`The dev seed has no recipe starting with "${start}". Run npm run dev:seed first.`);
  return found.title;
}

// The menu card is a link to the recipe, but its accessible name is not computed from the title, so match by href and text.
function recipeLink(page: import('@playwright/test').Page, title: string) {
  return page.locator('a[href^="/recipes/"]').filter({ hasText: title.slice(0, 20) }).first();
}

async function signUpAs(page: import('@playwright/test').Page, name: string, email: string) {
  const form = visibleForm(page);
  await form.getByLabel('Name', { exact: true }).fill(name);
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill('password123');
  await form.getByLabel('Confirm password').fill('password123');
  await form.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toBeVisible();
}

async function planMeal(page: import('@playwright/test').Page, meal: 'Lunch' | 'Dinner', recipe: string) {
  await page.getByRole('button', { name: meal, exact: true }).click();
  await page.getByRole('button', { name: `Add ${meal.toLowerCase()}` }).click();
  const form = page.locator('form:visible');
  await form.getByLabel('Main').fill(recipe.slice(0, 3));
  await page.getByRole('option', { name: recipe }).click();
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(recipeLink(page, recipe)).toBeVisible();
}

// The walkthrough is recorded as video, which Playwright only allows at file scope.
// Video needs Playwright's ffmpeg binary (npx playwright install ffmpeg), so it is opt-in with CAPTURE_VIDEO=1.
// slowMo pauses after every action, so each tap stays on screen long enough to follow in the video.
test.use({
  viewport: PHONE,
  deviceScaleFactor: 2,
  video: process.env.CAPTURE_VIDEO ? { mode: 'on', size: PHONE } : 'off',
  launchOptions: { slowMo: process.env.CAPTURE_VIDEO ? 700 : 0 },
});

test('records the walkthrough and captures the app screens', async ({ page }) => {
  test.skip(!enabled, 'Set CAPTURE_LANDING=1 to regenerate the landing media');
  mkdirSync(OUT, { recursive: true });
  const pasta = seededTitle('Pasta con pomodorini');
  const chicken = seededTitle('Pollo al limone');

  // Start on the landing page, as a visitor would.
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(PAUSE * 2);
  await page.screenshot({ path: `${OUT}/demo-poster.png` });

  await page.getByRole('link', { name: 'Create account' }).first().click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await signUpAs(page, 'Sam', 'sam@example.com');

  // Weekly menu: plan lunch and dinner from the household's recipes.
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await planMeal(page, 'Lunch', pasta);
  await planMeal(page, 'Dinner', chicken);
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/menu.png` });

  // Open the lunch recipe and add its ingredients to the shopping list.
  await page.getByRole('button', { name: 'Lunch', exact: true }).click();
  await recipeLink(page, pasta).click();
  await expect(page.getByRole('heading', { name: pasta })).toBeVisible();
  for (let added = 0; added < 3; added++) {
    await page.getByRole('button', { name: /^Add .+ to shopping list$/ }).first().click();
    await expect(page.getByRole('button', { name: /^Added .+ to shopping list$/ })).toHaveCount(added + 1);
    await page.waitForTimeout(PAUSE / 2);
  }
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await expect(page.getByRole('listitem').filter({ hasText: pasta.slice(0, 20) })).toBeVisible();
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/recipes.png` });

  // Shopping list: the ingredients are there, under their categories.
  await page.getByRole('link', { name: 'Shopping', exact: true }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/shopping.png` });

  if (process.env.CAPTURE_VIDEO) {
    const video = page.video();
    await page.close();
    await video?.saveAs(`${OUT}/demo.webm`);
  }
});
