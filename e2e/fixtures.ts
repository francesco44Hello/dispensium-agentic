import { test as base, expect } from '@playwright/test';

const FIREBASE_TRAFFIC = /(identitytoolkit|securetoken|firestore|storage|firebaseinstallations|firebaseappcheck|firebaseremoteconfig)\.googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.googleapis\.com|firebasestorage\.app|www\.google-analytics\.com|accounts\.google\.com|apis\.google\.com/;

// Auto-fixture: every test fails if the page talks to a real Firebase backend.
// Firebase hosts are aborted at the network layer, so no request leaves the browser even if the app tries.
export const test = base.extend<{ noFirebaseTraffic: void }>({
  noFirebaseTraffic: [
    async ({ page }, use) => {
      const hits = new Set<string>();
      await page.route(
        (url) => FIREBASE_TRAFFIC.test(url.toString()),
        async (route) => {
          hits.add(route.request().url());
          await route.abort();
        },
      );
      page.on('request', (request) => {
        if (FIREBASE_TRAFFIC.test(request.url())) hits.add(request.url());
      });
      await use();
      expect([...hits], 'e2e must run in mock mode and never call Firebase').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
