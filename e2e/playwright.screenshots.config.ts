import { defineConfig, devices } from '@playwright/test';

// Separate Playwright config used only to capture documentation screenshots
// (../docs/imgs/e2e). Kept out of the default config (testDir ./tests) so the
// CI e2e gate never depends on / writes documentation artifacts.
const HA_URL = process.env.HA_URL || 'http://localhost:8123';

export default defineConfig({
  testDir: './screenshots',
  globalSetup: './global-setup.ts',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: HA_URL,
    storageState: 'storage-state.json',
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2, // crisp retina screenshots for docs
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
