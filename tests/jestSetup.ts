// Global test setup file for Jest
// This file runs before all test files

// Shim for String.prototype.replaceAll in older Node versions
if (!String.prototype.replaceAll) {
  Object.defineProperty(String.prototype, 'replaceAll', {
    value: function(this: string, search: string, replacement: string): string {
      const regex = new RegExp(search, 'g');
      return this.replace(regex, replacement);
    },
    configurable: true,
    writable: true,
  });
}

/**
 * Global test utilities and setup
 * 
 * Test configuration for Home Assistant Lovelace cards
 * 
 * Environment requirements:
 * - HA_HOST: URL of Home Assistant instance (default: http://localhost:8123)
 * - HA_TOKEN: Long-lived API token for authentication
 * - CI: Set to 'true' for CI/CD environments
 * 
 * Test execution:
 * - Unit tests: npm test (all Jest tests)
 * - Integration tests: npm test -- tests/integration/
 * - E2E tests: npx playwright test
 */

// Set strict timeout for all tests
jest.setTimeout(30000);

// Mock console methods for testing
describe('Global Setup', () => {
  afterAll(() => {
    // Restore mocks after all tests
  });
});
