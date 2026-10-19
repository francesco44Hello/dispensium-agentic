import { test, expect } from './fixtures';
import { signUp } from './helpers';

// Page titles use the --font-weight-title token. Balsamiq Sans only ships 400 and 700.
test('page titles use the title token (400), the brand header uses the brand token (700)', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Log in' })).toHaveCSS('font-weight', '400');

  await signUp(page);
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toHaveCSS('font-weight', '700');
  await expect(page.getByRole('heading', { name: "What's missing?" })).toHaveCSS('font-weight', '400');
});
