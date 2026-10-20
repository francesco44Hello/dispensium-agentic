import { test, expect } from './fixtures';

// Google sign-in opens a popup. Allow same-origin pages to keep a handle on that popup.
test('pages send Cross-Origin-Opener-Policy same-origin-allow-popups', async ({ request }) => {
  const response = await request.get('/login');
  expect(response.headers()['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
});
