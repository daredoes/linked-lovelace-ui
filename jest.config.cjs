module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ["<rootDir>/jestSetup.ts"],
  // Jest covers the src/ unit tests only. The Playwright e2e specs live in e2e/
  // (run via `cd e2e && npx playwright test`) and must not be collected here.
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};