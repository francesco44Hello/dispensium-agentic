import { test, expect } from './fixtures';
import { signUp } from './helpers';

// The shelf mark sits beside the app title on desktop only. On mobile the title is centred, so the mark stays hidden.
test('the shelf mark is hidden on a phone and shown beside the title on desktop', async ({ page }) => {
  await signUp(page);
  const mark = page.getByTestId('brand-mark');
  await page.setViewportSize({ width: 415, height: 900 });
  await expect(mark).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(mark).toBeVisible();
});

// The landing top bar is tight on a phone, so its mark shows from the landing page's desktop breakpoint up.
test('the landing mark is hidden on a phone and shown on desktop', async ({ page }) => {
  await page.goto('/welcome');
  const mark = page.getByRole('banner').getByTestId('brand-mark');
  await page.setViewportSize({ width: 415, height: 900 });
  await expect(mark).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(mark).toBeVisible();
});

// The browser tab shows the shelf mark as the page icon, on every page.
test('the browser tab icon is the shelf mark', async ({ page }) => {
  await page.goto('/welcome');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/brand/mark.svg');
});
