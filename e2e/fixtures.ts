import { test as base, expect } from '@playwright/test';

const FIREBASE_TRAFFIC = /(identitytoolkit|securetoken|firestore)\.googleapis\.com|firebaseio\.com/;

// Auto-fixture: every test fails if the page talks to a real Firebase backend.
export const test = base.extend<{ noFirebaseTraffic: void }>({
  noFirebaseTraffic: [
    async ({ page }, use) => {
      const hits: string[] = [];
      page.on('request', (request) => {
        if (FIREBASE_TRAFFIC.test(request.url())) hits.push(request.url());
      });
      await use();
      expect(hits, 'e2e must run in mock mode and never call Firebase').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
