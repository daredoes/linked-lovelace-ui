import { defineConfig, devices } from '@playwright/test';

// e2e suite for Linked Lovelace running against a real Home Assistant instance
// (see docker-compose.yml). global-setup.ts onboards HA via its REST API and
// writes an authenticated storageState so specs start already logged in.
const HA_URL = process.env.HA_URL || 'http://localhost:8123';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: HA_URL,
    storageState: 'storage-state.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Watchable runs: `HEADED=1 SLOWMO=600 npx playwright test` (or --headed).
    headless: process.env.HEADED ? false : undefined,
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
