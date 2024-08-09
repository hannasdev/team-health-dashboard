import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  bail: 1,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  rootDir: './',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/setupTests.ts'],
      moduleNameMapper: {
        '@/(.*)': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
          },
        ],
      },
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/setupTestsE2E.ts'],
    },
  ],
};

export default config;
