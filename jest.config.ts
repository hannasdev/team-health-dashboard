import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  bail: 1,
  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: ['ts', 'js'],
  rootDir: './',
  extensionsToTreatAsEsm: ['.ts'],
  maxWorkers: 2, // Limit the number of workers
  maxConcurrency: 1, // Ensure only one test file runs at a time
  testTimeout: 30000, // Increase timeout to 30 seconds
  globalSetup: '<rootDir>/jest.global-setup.mjs',
  globalTeardown: '<rootDir>/jest.global-teardown.mjs',
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testEnvironment: 'node',
      testPathIgnorePatterns: ['<rootDir>/src/e2e/', '<rootDir>/dist'],
      setupFiles: ['<rootDir>/src/setupTests.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
      },
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/e2e/**/*.e2e.test.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/src/setupTests.ts'],
      testPathIgnorePatterns: ['<rootDir>/dist/'],
      transformIgnorePatterns: ['node_modules/(?!(@octokit)/)'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
      },
    },
  ],
  watchPathIgnorePatterns: ['<rootDir>/dist/'],
};

export default config;
