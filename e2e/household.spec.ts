import { test, expect } from './fixtures';
import { addItem, alertOf, fillSignUp, goToSignUp, logOut, PASSWORD, signUp, visibleForm } from './helpers';

test('a housemate opens the shared invite link, signs up and joins the household', async ({ page }) => {
  // Owner creates the shared link and adds an item.
  await signUp(page, 'alice@example.com');
  await addItem(page, 'Parmigiano');
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await expect(page.getByText('owner', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = (await page.locator('code').innerText()).trim();
  expect(link).toMatch(/\/join\/[A-Z2-9]{8}$/);
  const code = link.slice(link.lastIndexOf('/') + 1);
  await logOut(page);

  // The housemate opens the link. The sign-up page reads the invite from its address, so it is set
  // before signing up. Client-side navigation keeps the in-memory backend.
  await goToSignUp(page);
  await page.evaluate((invite) => window.history.replaceState(null, '', `/signup?invite=${invite}`), code);
  await fillSignUp(page, 'bob@example.com', PASSWORD, { landOnHome: false });

  // The join card names the owner (the sign-up helper's name) and asks to accept.
  await expect(page.getByText('Test User invited you to join their household')).toBeVisible();
  await page.getByRole('button', { name: 'Accept' }).click();

  // Bob now sees Alice's item on the shared list.
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByRole('checkbox', { name: 'Parmigiano' })).toBeVisible();
});

test('a housemate can still join with a typed invite code', async ({ page }) => {
  await signUp(page, 'alice@example.com');
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await page.getByRole('button', { name: 'Create invite link' }).click();
  const link = (await page.locator('code').innerText()).trim();
  const code = link.slice(link.lastIndexOf('/') + 1);
  await logOut(page);

  await goToSignUp(page);
  await fillSignUp(page, 'bob@example.com');
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await visibleForm(page).getByLabel('Invite code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Join household' }).click();
  await expect(page.getByText('You joined the household.')).toBeVisible();
  await expect(page.getByText('Test User', { exact: true })).toBeVisible();
});

test('an invalid invite code is rejected', async ({ page }) => {
  await signUp(page);
  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await visibleForm(page).getByLabel('Invite code').fill('ZZZZ2345');
  await page.getByRole('button', { name: 'Join household' }).click();
  await expect(alertOf(page)).toHaveText('That invite code is not valid.');
});
