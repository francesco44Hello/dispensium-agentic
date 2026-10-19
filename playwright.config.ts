import { defineConfig } from '@playwright/test';

const PORT = 3100;

// E2E always runs against the in-memory mock backend (NEXT_PUBLIC_AUTH_MOCK=true),
// never against a real Firebase project. See e2e/fixtures.ts for the guard.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    viewport: { width: 415, height: 900 },
    deviceScaleFactor: 2,
  },
  projects: [
    { name: 'mobile', testIgnore: /visual\.spec\.ts/ },
    { name: 'visual', testMatch: /visual\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    env: { NEXT_PUBLIC_AUTH_MOCK: 'true' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
