import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  bail: 5,
  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: ['ts', 'js'],
  rootDir: './',
  extensionsToTreatAsEsm: ['.ts'],
  maxWorkers: 2, // Limit the number of workers
  maxConcurrency: 1, // Ensure only one test file runs at a time
  testTimeout: 30000, // Increase timeout to 30 seconds
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testEnvironment: 'node',
      testPathIgnorePatterns: [
        '<rootDir>/src/__tests__/e2e/',
        '<rootDir>/dist',
      ],
      setupFiles: ['<rootDir>/src/__tests__/setupTests.ts'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
      },
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/__tests__/integration/**/*.integration-test.ts',
      ],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/src/__tests__/setupTests.ts'],
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
      testMatch: ['<rootDir>/src/__tests__/e2e/**/*.e2e.test.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/src/__tests__/setupTests.ts'],
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
