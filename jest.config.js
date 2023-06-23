/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'rollup-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ["<rootDir>/jestSetup.ts"]
};