import { defineConfig, devices } from '@playwright/test';

// Separate Playwright config used only to record the narrated demo video
// (scripts/video.sh). Kept out of the default config (testDir ./tests) so the
// CI e2e gate never depends on video capture.
const HA_URL = process.env.HA_URL || 'http://localhost:8123';

export default defineConfig({
  testDir: './video',
  globalSetup: './global-setup.ts',
  timeout: 900_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: HA_URL,
    // Bounded so a stuck click fails with the locator instead of eating the
    // whole test timeout.
    actionTimeout: 25_000,
    storageState: 'storage-state.json',
    // Captions are drawn into the page, so recording the viewport captures them.
    // Video size must match the viewport or the recording is letterboxed.
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 150 },
  },
  projects: [
    {
      name: 'chromium',
      // Viewport goes after the device spread: the preset would otherwise pin
      // it back to 720 and the recording would show a band under the page.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
