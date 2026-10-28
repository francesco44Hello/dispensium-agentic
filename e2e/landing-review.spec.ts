import { mkdirSync } from 'node:fs';
import { test, expect } from './fixtures';

// Full-page captures of the landing page for visual review. Not part of the default run.
// Run with: CAPTURE_LANDING=1 npx playwright test e2e/landing-review.spec.ts
const REVIEW = 'e2e-artifacts/landing';

test.skip(!process.env.CAPTURE_LANDING, 'Set CAPTURE_LANDING=1 to capture the landing review shots');

test('mobile landing review', async ({ page }) => {
  mkdirSync(REVIEW, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/welcome');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${REVIEW}/mobile.png`, fullPage: true });
});

test('desktop landing review', async ({ page }) => {
  mkdirSync(REVIEW, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/welcome');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${REVIEW}/desktop-top.png` });
  await page.screenshot({ path: `${REVIEW}/desktop.png`, fullPage: true });
});

test('signed-in desktop app header review', async ({ page }) => {
  mkdirSync(REVIEW, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/signup');
  const form = page.locator('form:visible');
  await form.getByLabel('Name', { exact: true }).fill('Sam');
  await form.getByLabel('Email').fill('sam@example.com');
  await form.getByLabel('Password', { exact: true }).fill('password123');
  await form.getByLabel('Confirm password').fill('password123');
  await form.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toBeVisible();
  await page.screenshot({ path: `${REVIEW}/app-desktop.png` });
});
