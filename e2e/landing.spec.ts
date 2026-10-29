import { test, expect } from './fixtures';

test('a visitor reaches log in and sign up from the landing page', async ({ page }) => {
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1, name: 'One list for the whole week.' })).toBeVisible();

  await page.getByRole('link', { name: 'Log in' }).first().click();
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Create account' }).first().click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
});
