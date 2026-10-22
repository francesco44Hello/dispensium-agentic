import { readFileSync } from 'node:fs';
import path from 'node:path';
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
  const cover = page.getByAltText('Photo cake');
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
