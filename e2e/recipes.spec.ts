import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { signUp } from './helpers';

// The import route is stubbed in the browser, so no real page is fetched during e2e.
const IMPORTED = { title: 'Imported soup', ingredients: ['water', 'salt'], steps: ['Boil the water'], image: '' };

test('the add button appears on the recipes page only', async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole('button', { name: 'Add recipe' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add recipe' })).toBeVisible();
});

test('the sheet opens, a recipe can be saved and then appears in the list', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await expect(page.getByText(/No recipes yet/)).toBeVisible();

  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAttribute('data-open', 'true');

  await sheet.getByLabel('Recipe title').fill('Pasta al pomodoro');
  await sheet.getByLabel('Category').selectOption('Lunch');
  await sheet.getByLabel('Ingredient 1').fill('pasta');
  await sheet.getByLabel('Step 1').fill('Boil the pasta');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  // Closed, the sheet is inert and drops out of the accessibility tree, so check its state by selector.
  await expect(page.locator('[role="dialog"]')).toHaveAttribute('data-open', 'false');
  await expect(page.getByRole('listitem').filter({ hasText: 'Pasta al pomodoro' })).toBeVisible();
});

test('a link can be imported into the form before saving', async ({ page }) => {
  await signUp(page);
  await page.route('**/api/scrape-recipe', (route) => route.fulfill({ json: IMPORTED }));
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();

  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe link').fill('https://example.com/soup');
  await sheet.getByRole('button', { name: 'Import' }).click();

  await expect(sheet.getByLabel('Recipe title')).toHaveValue('Imported soup');
  await expect(sheet.getByLabel('Ingredient 2')).toHaveValue('salt');
});

test('a failed import shows the server message and keeps the form usable', async ({ page }) => {
  await signUp(page);
  await page.route('**/api/scrape-recipe', (route) =>
    route.fulfill({ status: 404, json: { error: 'Could not find a recipe on this page.' } }),
  );
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();

  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe link').fill('https://example.com/none');
  await sheet.getByRole('button', { name: 'Import' }).click();

  await expect(sheet.getByRole('alert')).toHaveText('Could not find a recipe on this page.');
  await expect(sheet.getByLabel('Recipe title')).toBeEditable();
});

test('a saved recipe opens on its own page and can be left again', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Lemon tart');
  await sheet.getByLabel('Ingredient 1').fill('lemon');
  await sheet.getByLabel('Step 1').fill('Bake it');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Lemon tart' }).click();
  await expect(page).toHaveURL(/\/recipes\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Lemon tart' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Ingredients' })).toContainText('lemon');

  await page.getByRole('link', { name: 'Back to recipes' }).click();
  await expect(page).toHaveURL(/\/recipes$/);
});

test('the add sheet is white, its inputs have no background, and it opens empty each time', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(sheet.getByLabel('Recipe title')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await sheet.getByLabel('Recipe title').fill('Half written');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await expect(page.getByRole('dialog').getByLabel('Recipe title')).toHaveValue('');
});

const COVER = path.join(__dirname, 'fixtures', 'cover.png');

test('a photo chosen in the form is compressed, saved and shown on the recipe page', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe photo').setInputFiles(COVER);
  await expect(sheet.getByAltText('Recipe cover')).toBeVisible();
  await sheet.getByLabel('Recipe title').fill('Photo cake');
  await sheet.getByLabel('Ingredient 1').fill('flour');
  await sheet.getByLabel('Step 1').fill('Mix');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Photo cake' }).click();
  await expect(page).toHaveURL(/\/recipes\/[^/]+$/);
  // Next keeps the previous pages mounted but hidden, so only visible images are checked here.
  const cover = page.locator('img[alt="Photo cake"]:visible');
  await expect(cover).toHaveCount(1);
  await expect(cover).toHaveAttribute('src', /^blob:/);
  expect(await cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('an imported photo is copied through our route and attached to the form', async ({ page }) => {
  await signUp(page);
  await page.route('**/api/scrape-recipe', (route) =>
    route.fulfill({ json: { ...IMPORTED, image: 'https://example.com/soup.png' } }),
  );
  await page.route('**/api/recipe-image', (route) =>
    route.fulfill({ contentType: 'image/png', body: readFileSync(COVER) }),
  );
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();

  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe link').fill('https://example.com/soup');
  await sheet.getByRole('button', { name: 'Import' }).click();

  await expect(sheet.getByAltText('Recipe cover')).toHaveAttribute('src', /^blob:/);
});

test('the recipe page has no header, runs full width, and the cart adds an ingredient to the shopping list', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Garlic bread');
  await sheet.getByLabel('Ingredient 1').fill('garlic');
  await sheet.getByLabel('Step 1').fill('Toast it');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();
  await page.getByRole('link', { name: 'Garlic bread' }).click();
  await expect(page).toHaveURL(/\/recipes\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Garlic bread' })).toBeVisible();

  // Next keeps the previous pages mounted but hidden, so only visible elements count here.
  await expect(page.locator('button[aria-label="Open menu"]:visible')).toHaveCount(0);

  const article = page.locator('article:visible').first();
  const box = await article.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.width).toBeGreaterThanOrEqual((viewport?.width ?? 0) - 1);

  await page.getByRole('button', { name: 'Add garlic to shopping list' }).click();
  await expect(page.getByRole('button', { name: 'Added garlic to shopping list' })).toBeDisabled();
  await page.getByRole('link', { name: 'Shopping', exact: true }).click();
  // Hidden pages stay mounted after navigation, so only visible text is checked.
  await expect(page.locator('span:visible').filter({ hasText: /^garlic$/ })).toHaveCount(1);
});

test('the end of the recipe page sits about 32px above the bottom bar', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Long toast');
  await sheet.getByLabel('Ingredient 1').fill('bread');
  // Enough steps that the page scrolls, so the bottom of the page is the real end.
  for (let i = 1; i <= 12; i++) {
    if (i > 3) await sheet.getByRole('button', { name: 'Add step' }).click();
    await sheet.getByLabel(`Step ${i}`).fill(`Step number ${i}`);
  }
  await sheet.getByRole('button', { name: 'Save recipe' }).click();
  await page.getByRole('link', { name: 'Long toast' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Long toast' })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  // The bottom-most section is the delete block, which now sits under the steps, so it is the element that must clear the bar.
  const lastStep = await page.locator('article section:visible').last().boundingBox();
  const nav = await page.locator('nav[aria-label="Main"]:visible').boundingBox();
  expect(lastStep && nav).toBeTruthy();
  const gap = (nav?.y ?? 0) - ((lastStep?.y ?? 0) + (lastStep?.height ?? 0));
  expect(gap).toBeGreaterThanOrEqual(24);
  expect(gap).toBeLessThanOrEqual(40);
});

test('a recipe can be deleted from its page after a second confirmation', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Old pancakes');
  await sheet.getByLabel('Ingredient 1').fill('flour');
  await sheet.getByLabel('Step 1').fill('Fry them');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Old pancakes' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Old pancakes' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete recipe' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole('link', { name: 'Old pancakes' })).toHaveCount(0);
});

test('a recipe ingredient is added to the shopping list as a clean name', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Cheesy toast');
  await sheet.getByLabel('Ingredient 1').fill('60g/2¼oz mature cheddar, grated');
  await sheet.getByLabel('Step 1').fill('Grill it');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Cheesy toast' }).click();
  await page.locator('button[aria-label*="mature cheddar"]').click();
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByRole('checkbox', { name: 'mature cheddar' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /60g/ })).toHaveCount(0);
});

async function saveRecipeWithLabel(page: Page, title: string, label: string) {
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill(title);
  await sheet.getByLabel('Category').selectOption('Lunch');
  await sheet.getByRole('button', { name: label, exact: true }).click();
  await sheet.getByLabel('Ingredient 1').fill('pasta');
  await sheet.getByLabel('Step 1').fill('Boil the pasta');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: title })).toBeVisible();
}

test('recipes can be filtered by label, and All brings them back', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await saveRecipeWithLabel(page, 'Quick pasta', 'Quick & Easy ⚡');
  await saveRecipeWithLabel(page, 'Winter stew', 'Cozy Winter ❄️');

  const filter = page.getByRole('group', { name: 'Filter by label' });
  await filter.getByRole('button', { name: 'Quick & Easy ⚡' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Quick pasta' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Winter stew' })).toHaveCount(0);

  await filter.getByRole('button', { name: 'All' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Winter stew' })).toBeVisible();
});
