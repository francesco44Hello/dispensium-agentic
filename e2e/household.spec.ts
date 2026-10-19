import { test, expect } from './fixtures';
import { addItem, alertOf, fillSignUp, goToSignUp, logOut, signUp, visibleForm } from './helpers';

test('a housemate joins with an invite code and sees the shared list', async ({ page }) => {
  // Owner creates an invite and adds an item.
  await signUp(page, 'alice@example.com');
  await addItem(page, 'Parmigiano');
  await page.getByRole('link', { name: 'Open household menu' }).click();
  await expect(page.getByText('You · owner')).toBeVisible();
  await page.getByRole('button', { name: 'Create invite code' }).click();
  const code = (await page.locator('code').innerText()).trim();
  expect(code).toMatch(/^[A-Z2-9]{8}$/);
  await logOut(page);

  // Second user signs up (client-side navigation keeps the in-memory backend) and joins.
  await goToSignUp(page);
  await fillSignUp(page, 'bob@example.com');
  await page.getByRole('link', { name: 'Open household menu' }).click();
  await visibleForm(page).getByLabel('Invite code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Join household' }).click();
  await expect(page.getByText('You joined the household.')).toBeVisible();
  await expect(page.getByText('Housemate · owner')).toBeVisible();

  // Bob now sees Alice's item on the shared list.
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByRole('checkbox', { name: 'Parmigiano' })).toBeVisible();
});

test('an invalid invite code is rejected', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Open household menu' }).click();
  await visibleForm(page).getByLabel('Invite code').fill('ZZZZ2345');
  await page.getByRole('button', { name: 'Join household' }).click();
  await expect(alertOf(page)).toHaveText('That invite code is not valid.');
});
