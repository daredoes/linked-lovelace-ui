module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Jest covers the src/ unit tests only. The Playwright e2e specs live in e2e/
  // (run via `cd e2e && npx playwright test`) and must not be collected here.
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  // Count every source file, not just the ones tests import, so untested
  // areas (hass controller, the Lit card classes) show up in the report.
  // diff.js is vendored google-diff-match-patch; version.ts is generated.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/version.ts",
  ],
  coverageThreshold: {
    // Modest floor just under today's numbers (35/32/27/36); raise as the
    // untested areas (Lit card classes, localize) gain tests.
    global: {
      statements: 34,
      branches: 30,
      functions: 26,
      lines: 34,
    },
  },
};