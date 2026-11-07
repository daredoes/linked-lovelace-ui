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
    // Jest subtracts files with their own threshold from `global`, so this floor
    // only measures the rest of src/. It sits just under today's numbers
    // (29/20/24/28); raise it as the Lit card classes and localize gain tests.
    global: {
      statements: 28,
      branches: 19,
      functions: 23,
      lines: 27,
    },
    // Code that decides what gets written over a user's dashboards.
    "./src/linked-lovelace-api.ts": { statements: 95, branches: 95, functions: 95, lines: 95 },
    "./src/controllers/hass.ts": { statements: 95, branches: 95, functions: 95, lines: 95 },
    "./src/v2/linkedLovelace.ts": { statements: 95, branches: 95, functions: 95, lines: 95 },
    "./src/helpers/templates.ts": { statements: 95, branches: 90, functions: 95, lines: 95 },
  },
};