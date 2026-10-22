import { test } from './fixtures';
import { addItem, signUp } from './helpers';

// Captures pages to e2e-artifacts/visual/ for side-by-side review against screenshots/.
// Not an assertion: run with `npm run test:visual`, then compare the images (see the visual-qa skill).
test('capture list, household and login pages', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: 'e2e-artifacts/visual/login.png' });

  await signUp(page);
  for (const name of ['Cacao', 'Olio', 'Sale grosso', 'Latte condensato', 'Parmigiano']) {
    await addItem(page, name);
  }
  await page.getByText('Olio').click();
  await page.screenshot({ path: 'e2e-artifacts/visual/list.png' });

  await page.getByRole('link', { name: 'Household', exact: true }).click();
  await page.getByRole('button', { name: 'Create invite code' }).click();
  await page.screenshot({ path: 'e2e-artifacts/visual/household.png' });
});
