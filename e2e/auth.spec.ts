import { test, expect } from './fixtures';
import { PASSWORD, alertOf, goToSignUp, logOut, signUp, visibleForm } from './helpers';

test('redirects an unauthenticated visitor from / to /welcome', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
});

test('sign up lands on the list and log out returns to welcome', async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole('heading', { name: "What's missing?" })).toBeVisible();
  await logOut(page);
});

test('rejects a wrong password, then accepts the right one', async ({ page }) => {
  const email = await signUp(page);
  await logOut(page);
  // Client-side hop from the welcome page: a reload would clear the in-memory mock accounts.
  await page.getByRole('link', { name: 'Log in' }).first().click();
  await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();

  await visibleForm(page).getByLabel('Email').fill(email);
  await visibleForm(page).getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(alertOf(page)).toHaveText('Email or password is incorrect.');

  await visibleForm(page).getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toBeVisible();
});

test('rejects mismatched passwords on sign up', async ({ page }) => {
  await page.goto('/signup');
  await visibleForm(page).getByLabel('Email').fill('a@example.com');
  await visibleForm(page).getByLabel('Password', { exact: true }).fill(PASSWORD);
  await visibleForm(page).getByLabel('Confirm password').fill('different-pass');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(alertOf(page)).toHaveText('Passwords do not match.');
});

test('rejects a duplicate email on sign up', async ({ page }) => {
  const email = await signUp(page);
  await logOut(page);
  await goToSignUp(page);
  await visibleForm(page).getByLabel('Email').fill(email);
  await visibleForm(page).getByLabel('Password', { exact: true }).fill(PASSWORD);
  await visibleForm(page).getByLabel('Confirm password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(alertOf(page)).toHaveText('An account with this email already exists.');
});
