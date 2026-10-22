import { test, expect } from './fixtures';

// Google sign-in opens a popup. Allow same-origin pages to keep a handle on that popup.
test('pages send Cross-Origin-Opener-Policy same-origin-allow-popups', async ({ request }) => {
  const response = await request.get('/login');
  expect(response.headers()['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
});

test('pages send nosniff, a strict referrer policy and refuse framing', async ({ request }) => {
  const response = await request.get('/login');
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('DENY');
});
