import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export const PASSWORD = 'password123';

// With cacheComponents, Next keeps the previous route mounted but hidden after a client-side
// navigation, so two forms can exist at once. Always scope form locators to the visible one.
export const visibleForm = (page: Page) => page.locator('form:visible');

// Mock auth state lives in the page, so tests that need several users must navigate
// client-side (links, router) and never reload the page between users.
export async function fillSignUp(page: Page, email: string, password = PASSWORD) {
  const form = visibleForm(page);
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(password);
  await form.getByLabel('Confirm password').fill(password);
  await form.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('heading', { name: 'Dispensium' })).toBeVisible();
}

export async function signUp(page: Page, email = `user-${Date.now()}@example.com`) {
  await page.goto('/signup');
  await fillSignUp(page, email);
  return email;
}

export async function addItem(page: Page, name: string) {
  await page.getByPlaceholder(/add a grocery item/i).fill(name);
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByRole('checkbox', { name })).toBeVisible();
}

export async function logOut(page: Page) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

// Next.js renders a hidden route announcer with role="alert"; skip it.
export const alertOf = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

// Client-side hop from /login to /signup. Wait for the sign-up form to be the visible one, otherwise
// a visible-form locator can resolve to the outgoing login form halfway through the transition.
export async function goToSignUp(page: Page) {
  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
}
