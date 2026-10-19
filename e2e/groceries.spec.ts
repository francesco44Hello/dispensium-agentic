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

test('the Grocery completed button is sticky and the input sits above the list', async ({ page }) => {
  await signUp(page);
  await addItem(page, 'Cacao');
  const footer = page.getByRole('button', { name: 'Grocery completed' }).locator('..');
  await expect(footer).toHaveCSS('position', 'sticky');

  const input = await page.getByPlaceholder(/add a grocery item/i).boundingBox();
  const item = await page.getByRole('checkbox', { name: 'Cacao' }).boundingBox();
  expect(input && item && input.y < item.y).toBe(true);
});

test('blocked characters are rejected with a validation message', async ({ page }) => {
  await signUp(page);
  await page.getByPlaceholder(/add a grocery item/i).fill('<>{}');
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(alertOf(page)).toContainText('valid item name');
});
