import { test, expect } from './fixtures';
import { addItem, alertOf, signUp } from './helpers';

test('adds items grouped by category', async ({ page }) => {
  await signUp(page);
  await expect(page.getByText('Your list is empty.')).toBeVisible();
  await addItem(page, 'Whole milk');
  await addItem(page, 'Olio');
  await expect(page.getByRole('heading', { name: /dairy/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /pantry/i })).toBeVisible();
});

test('tapping an item strikes it through, and Grocery completed removes it', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  await addItem(page, 'Olio');

  const complete = page.getByRole('button', { name: 'Grocery completed' });
  await expect(complete).toBeDisabled();

  await page.getByText('Olio').click();
  await expect(page.getByText('Olio')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(complete).toBeEnabled();

  await complete.click();
  await expect(page.getByRole('checkbox', { name: 'Olio' })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Cacao' })).toBeVisible();
  await expect(complete).toBeDisabled();
});

test('Grocery completed sits 24px above the bottom bar', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  const button = await page.getByRole('button', { name: 'Grocery completed' }).boundingBox();
  const bar = await page.getByRole('navigation', { name: 'Main' }).boundingBox();
  expect(button && bar).toBeTruthy();
  const gap = bar!.y - (button!.y + button!.height);
  expect(Math.abs(gap - 24)).toBeLessThanOrEqual(1);
});

test('the last item stays above Grocery completed when the list is long', async ({ page }) => {
  test.setTimeout(120_000);
  await signUp(page);
  const names = Array.from({ length: 14 }, (_, i) => `Item ${i + 1}`);
  for (const name of names) await addItem(page, name);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const last = await page.getByRole('checkbox', { name: 'Item 14' }).boundingBox();
  const button = await page.getByRole('button', { name: 'Grocery completed' }).boundingBox();
  expect(last && button).toBeTruthy();
  expect(last!.y + last!.height).toBeLessThanOrEqual(button!.y);
});

test('a ticked box is filled legacy green with a dark tick', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  const box = page.getByRole('checkbox', { name: 'Cacao' });
  await page.getByText('Cacao').click();
  await expect(box).toBeChecked();
  await expect(box).toHaveCSS('background-color', 'rgb(163, 220, 154)');
  // Legacy: a ticked box's border is the same green as its fill.
  await expect(box).toHaveCSS('border-top-color', 'rgb(163, 220, 154)');
});

test('Grocery completed is legacy green when enabled and grey when disabled', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  const button = page.getByRole('button', { name: 'Grocery completed' });
  await expect(button).toBeDisabled();
  await expect(button).toHaveCSS('background-color', 'rgb(188, 191, 194)');
  await page.getByText('Cacao').click();
  await expect(button).toBeEnabled();
  await expect(button).toHaveCSS('background-color', 'rgb(163, 220, 154)');
});

test('blocked characters are rejected with a validation message', async ({ page }) => {
  await signUp(page);
  await page.getByPlaceholder(/add a grocery item/i).fill('<>{}');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(alertOf(page)).toContainText('valid item name');
});
