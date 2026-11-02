import { test, expect } from './fixtures';
import { signUp } from './helpers';

// On a phone the bottom nav floats: a pill inset from the screen edges, not a full-width bar.
test('the bottom nav floats as a pill inset from the screen edges', async ({ page }) => {
  await signUp(page);
  await page.setViewportSize({ width: 415, height: 900 });
  const nav = page.locator('nav[aria-label="Main"]').first();
  const box = await nav.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThan(0);
  expect(box!.x + box!.width).toBeLessThan(415);
  expect(box!.y + box!.height).toBeLessThan(900);
});

// On the recipes page the add button sits above the pill, at its top right, and does not overlap it.
test('the recipes add button sits above the pill at its top right', async ({ page }) => {
  await signUp(page);
  await page.setViewportSize({ width: 415, height: 900 });
  await page.getByRole('link', { name: 'Recipes', exact: true }).click();
  const nav = await page.locator('nav[aria-label="Main"]').first().boundingBox();
  const add = await page.getByRole('button', { name: 'Add recipe' }).boundingBox();
  expect(nav).not.toBeNull();
  expect(add).not.toBeNull();
  expect(add!.y + add!.height).toBeLessThanOrEqual(nav!.y);
  expect(add!.x + add!.width / 2).toBeGreaterThan(415 / 2);
  expect(add!.x + add!.width).toBeLessThanOrEqual(nav!.x + nav!.width);
});
