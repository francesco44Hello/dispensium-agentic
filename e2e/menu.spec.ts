import { test, expect } from './fixtures';
import { signUp } from './helpers';

const dayLabel = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), num: d.getDate() };
};

test('the menu opens on today and can load up to two weeks back', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Plan the week' })).toBeVisible();

  const pills = page.locator('button[aria-pressed][aria-label]:visible').filter({ hasText: /\d/ });
  await expect(pills).toHaveCount(7);
  const today = dayLabel(0);
  await expect(page.getByRole('button', { name: `${today.name} ${today.num}` })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Load previous days' }).click();
  await page.getByRole('button', { name: 'Load previous days' }).click();
  await expect(pills).toHaveCount(21);
  const oldest = dayLabel(-14);
  await expect(page.getByRole('button', { name: `${oldest.name} ${oldest.num}` })).toBeVisible();
});

test('a meal picked from a recipe links to it, in both views', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Recipe title').fill('Pancakes');
  await sheet.getByLabel('Ingredient 1').fill('flour');
  await sheet.getByLabel('Step 1').fill('Fry them');
  await sheet.getByRole('button', { name: 'Save recipe' }).click();

  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Add lunch' }).click();
  const form = page.locator('form:visible');
  await form.getByLabel('Main').fill('pan');
  await page.getByRole('option', { name: 'Pancakes' }).click();
  await form.getByRole('button', { name: 'Save' }).click();

  const link = page.locator('a[href^="/recipes/"]:visible', { hasText: 'Pancakes' });
  await expect(link.first()).toBeVisible();

  await page.getByRole('button', { name: 'List view' }).click();
  await expect(page.locator('a[href^="/recipes/"]:visible', { hasText: 'Pancakes' }).first()).toBeVisible();
});

test('a past day can be planned', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Load previous days' }).click();
  const past = dayLabel(-3);
  await page.getByRole('button', { name: `${past.name} ${past.num}` }).click();
  await page.getByRole('button', { name: 'Add lunch' }).click();
  const form = page.locator('form:visible');
  await form.getByLabel('Main').fill('Leftover soup');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Leftover soup', { exact: true }).first()).toBeVisible();
});

test('the calendar opens on today, can load earlier days, and the list starts at today', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  const today = dayLabel(0);
  await expect(page.getByRole('button', { name: `${today.name} ${today.num}` })).toHaveAttribute('aria-pressed', 'true');

  const pills = page.locator('button[aria-pressed][aria-label]:visible').filter({ hasText: /\d/ });
  await expect(pills).toHaveCount(7);
  await page.getByRole('button', { name: 'Load previous days' }).click();
  await page.getByRole('button', { name: 'Load previous days' }).click();
  await expect(pills).toHaveCount(21);
  await expect(page.getByRole('button', { name: 'Load previous days' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Hide previous days' }).click();
  await expect(pills).toHaveCount(7);

  await page.getByRole('button', { name: 'List view' }).click();
  const first = page.locator('h3[data-today]:visible').first();
  await expect(first).toHaveAttribute('data-today', 'true');
  await expect(page.locator('h3[data-today]:visible')).toHaveCount(7);
  await page.getByRole('button', { name: 'Load previous days' }).click();
  await expect(page.locator('h3[data-today]:visible')).toHaveCount(14);
});

test('the last day sits about 32px above the bottom bar, in both views', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Load previous days' }).click();
  await page.getByRole('button', { name: 'Load previous days' }).click();

  // Day cards are measured by their edge; elsewhere the innermost elements, since wrappers stretch to the screen edge.
  const gapFromBar = () =>
    page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Main"]') as HTMLElement;
      const main = document.querySelector('main') as HTMLElement;
      const cards = [...main.querySelectorAll('section')];
      const bottoms = (cards.length
        ? cards
        : [...main.querySelectorAll('*')].filter((el) => !nav.contains(el) && el.children.length === 0)
      )
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0 && r.bottom <= window.innerHeight + 1)
        .map((r) => r.bottom);
      return nav.getBoundingClientRect().top - Math.max(...bottoms);
    });

  // The list scrolls, so its last day sits 32px above the bar. The calendar is shorter than the screen,
  // so there is nothing to scroll to the bar and no gap to measure.
  await page.getByRole('button', { name: 'List view' }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const listGap = await gapFromBar();
  expect(listGap).toBeGreaterThanOrEqual(24);
  expect(listGap).toBeLessThanOrEqual(40);

});

test('breakfast planned on a phone is still shown after switching to the desktop layout', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Breakfast', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await page.getByRole('button', { name: 'Add breakfast' }).click();
  const form = page.locator('form:visible');
  await form.getByLabel('Main').fill('Porridge');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Porridge')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByText('Porridge')).toBeVisible();
});

test('breakfast can be planned on the desktop layout', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signUp(page);
  await page.getByRole('link', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Breakfast', exact: true }).click();
  await page.getByRole('button', { name: 'Add breakfast' }).click();
  const form = page.locator('form:visible');
  await form.getByLabel('Main').fill('Porridge');
  await form.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Porridge')).toBeVisible();
});
