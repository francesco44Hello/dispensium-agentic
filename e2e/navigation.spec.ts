import { test, expect } from './fixtures';
import { addItem, signUp } from './helpers';

// Routes and headings mirror the legacy app so the nav behaves the same way.
const PAGES = [
  { tab: 'Recipes', path: '/recipes', heading: 'Everyday Recipes' },
  { tab: 'Menu', path: '/weekly-menu', heading: 'Plan the week' },
  { tab: 'Manage', path: '/manage-categories', heading: /Some items have not been included/ },
] as const;

test('each bottom nav tab opens its page', async ({ page }) => {
  await signUp(page);
  for (const { tab, path, heading } of PAGES) {
    await page.getByRole('link', { name: tab, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByRole('heading', { name: "What's missing?" })).toBeVisible();
});

test('the active tab uses the legacy blob shape and violet colours', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Recipes' }).click();
  await expect(page.getByRole('link', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page');
  const icon = page.getByRole('link', { name: 'Recipes' }).locator('span').first();
  await expect(icon).toHaveCSS('background-color', 'rgb(183, 177, 242)');
  await expect(icon).toHaveCSS('border-top-left-radius', '26% 58%');
});

test('list item names use regular weight and rows have 16px vertical padding', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  await expect(page.getByText('Cacao')).toHaveCSS('font-weight', '400');
  const row = page.getByRole('listitem').filter({ hasText: 'Cacao' });
  await expect(row).toHaveCSS('padding-top', '16px');
  await expect(row).toHaveCSS('padding-bottom', '16px');
});

test('header icons use the primary colour', async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole('link', { name: 'Open household menu' })).toHaveCSS('color', 'rgb(45, 60, 89)');
  await expect(page.getByRole('button', { name: 'Log out' })).toHaveCSS('color', 'rgb(45, 60, 89)');
});
