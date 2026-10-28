import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures';
import { addItem, goToSignUp, logOut, visibleForm } from './helpers';

// Regenerates the landing page media: app screenshots and the demo video in public/landing/, plus review shots.
// Mock backend only, like every e2e spec. Run with: CAPTURE_LANDING=1 npx playwright test e2e/landing-media.spec.ts
const enabled = !!process.env.CAPTURE_LANDING;
const OUT = 'public/landing';
const PAUSE = 900;

const PHONE = { width: 390, height: 844 };

async function signUpAs(page: import('@playwright/test').Page, name: string, email: string) {
  const form = visibleForm(page);
  await form.getByLabel('Name', { exact: true }).fill(name);
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill('password123');
  await form.getByLabel('Confirm password').fill('password123');
  await form.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toBeVisible();
}

// The walkthrough is recorded as video, which Playwright only allows at file scope.
// Video needs Playwright's ffmpeg binary (npx playwright install ffmpeg), so it is opt-in with CAPTURE_VIDEO=1.
test.use({
  viewport: PHONE,
  deviceScaleFactor: 2,
  video: process.env.CAPTURE_VIDEO ? { mode: 'on', size: PHONE } : 'off',
});

test('records the walkthrough and captures the app screens', async ({ page }) => {
  test.skip(!enabled, 'Set CAPTURE_LANDING=1 to regenerate the landing media');
  mkdirSync(OUT, { recursive: true });

  // The app's recipe placeholder (/fruit-login.jpg) is not in public/, so cards without a photo show a broken image.
  // Serve a plain tile for the captures only; the app itself is unchanged.
  await page.route('**/fruit-login.jpg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#b7b1f2"/></svg>',
    }),
  );

  // Start on the landing page, as a visitor would.
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(PAUSE * 2);
  await page.screenshot({ path: `${OUT}/demo-poster.png` });

  await page.getByRole('link', { name: 'Create account' }).first().click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await signUpAs(page, 'Sam', 'sam@example.com');

  // Shopping: add, then tick the first two.
  for (const item of ['Pasta', 'Tomatoes', 'Basil', 'Parmigiano', 'Lemons']) await addItem(page, item);
  await page.getByRole('checkbox', { name: 'Pasta' }).click();
  await page.getByRole('checkbox', { name: 'Tomatoes' }).click();
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/shopping.png` });

  // Recipes: two, one lunch and one dinner.
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  const recipes = [
    { title: 'Pasta al pomodoro', category: 'Lunch', ingredient: 'Pasta', step: 'Boil the pasta, then simmer it with the tomatoes' },
    { title: 'Lemon chicken', category: 'Dinner', ingredient: 'Chicken thighs', step: 'Roast with lemon and herbs until golden' },
  ];
  for (const recipe of recipes) {
    await page.getByRole('button', { name: 'Add recipe' }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel('Recipe title').fill(recipe.title);
    await sheet.getByLabel('Category').selectOption(recipe.category);
    await sheet.getByLabel('Ingredient 1').fill(recipe.ingredient);
    await sheet.getByLabel('Step 1').fill(recipe.step);
    await sheet.getByRole('button', { name: 'Save recipe' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: recipe.title })).toBeVisible();
  }
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/recipes.png` });

  // Menu: plan today's lunch and dinner from the recipes.
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  for (const [meal, option] of [
    ['Lunch', 'Pasta al pomodoro'],
    ['Dinner', 'Lemon chicken'],
  ] as const) {
    await page.getByRole('button', { name: meal, exact: true }).click();
    await page.getByRole('button', { name: `Add ${meal.toLowerCase()}` }).click();
    const form = page.locator('form:visible');
    await form.getByLabel('Main').fill(option.slice(0, 3));
    await page.getByRole('option', { name: option }).click();
    await form.getByRole('button', { name: 'Save' }).click();
  }
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: `${OUT}/menu.png` });

  // Household: invite a second member and show both names.
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await page.getByRole('button', { name: 'Create invite code' }).click();
  const code = (await page.locator('code').innerText()).trim();
  await logOut(page);

  await goToSignUp(page);
  await signUpAs(page, 'Alex', 'alex@example.com');
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await visibleForm(page).getByLabel('Invite code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Join household' }).click();
  await expect(page.getByText('You joined the household.')).toBeVisible();
  await page.waitForTimeout(PAUSE * 2);

  if (process.env.CAPTURE_VIDEO) {
    const video = page.video();
    await page.close();
    await video?.saveAs(`${OUT}/demo.webm`);
  }
});
