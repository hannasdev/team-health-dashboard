import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  bail: 1,
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'js'],
  rootDir: './',
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testEnvironment: 'node',
      testPathIgnorePatterns: ['<rootDir>/src/e2e/', '<rootDir>/dist'],
      setupFiles: ['<rootDir>/setupTests.ts'],
      moduleNameMapper: {
        // Must be here to work
        '@/(.*)': '<rootDir>/src/$1',
      },
      transform: {
        // Must be here to work
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
      },
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/e2e/**/*.e2e.test.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/setupTests.ts'],
      testPathIgnorePatterns: ['<rootDir>/dist/'],
      moduleNameMapper: {
        // Must be here to work
        '@/(.*)': '<rootDir>/src/$1',
      },
      transform: {
        // Must be here to work
        '^.+\\.(ts?|e2e\\.test\\.ts)$': ['ts-jest', { useESM: true }],
      },
      transformIgnorePatterns: ['node_modules/(?!(@octokit)/)'],
      modulePathIgnorePatterns: ['<rootDir>/dist/'],
    },
  ],
  watchPathIgnorePatterns: ['<rootDir>/dist/'],
};

export default config;
