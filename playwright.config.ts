import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Home Assistant E2E Testing
 * 
 * This configuration enables testing of Home Assistant Lovelace cards
 * with full browser support, shadow DOM testing, and integration with
 * the Home Assistant WebSocket API.
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: 'html',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_HOST || 'http://localhost:8123',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Set duration for the test to be considered flaky */
    actionTimeout: 10000,
    
    /* Set global timeout for page navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Allow JavaScript to bypass CSP */
        bypassCSP: !!process.env.PLAYWRIGHT_BYPASS_CSP,
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        bypassCSP: !!process.env.PLAYWRIGHT_BYPASS_CSP,
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        bypassCSP: !!process.env.PLAYWRIGHT_BYPASS_CSP,
      },
    },

    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
});

/**
 * Home Assistant E2E Testing Guidelines:
 * 
 * 1. Authentication:
 *    - Use long-lived access tokens for API authentication
 *    - Store tokens securely in environment variables
 *    - Handle authentication flows in page fixtures
 * 
 * 2. Shadow DOM Testing:
 *    - Home Assistant uses web components with shadow DOM
 *    - Playwright v1.26+ pierces shadow roots automatically
 *    - Use selectors that work with shadow DOM
 * 
 * 3. Health Check:
 *    - Verify Home Assistant is ready before navigation
 *    - Check /api/states endpoint availability
 *    - Handle startup delays gracefully
 * 
 * 4. Fixture Management:
 *    - Create fixtures for common operations
 *    - Use page fixtures for authentication
 *    - Share context across tests when needed
 * 
 * 5. Timeout Handling:
 *    - Account for HA initialization time
 *    - Use explicit waits for dynamic content
 *    - Set appropriate timeouts per operation
 */

/**
 * Helper function to create Home Assistant page fixture with authentication
 */
function createHAPage() {
  // Navigate to HA login page
  // Handle authentication if token provided
  // This is a helper function for future test configuration
  // The baseURL is already configured in the main config
}


/**
 * Expected Home Assistant Test Structure:
 * 
 * tests/e2e/
 * ├── card-initialization.test.ts
 * ├── template-rendering.test.ts
 * ├── large-dashboards.test.ts
 * └── api-integration.test.ts
 */
