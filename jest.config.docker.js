export default {
  verbose: true,
  moduleFileExtensions: ['js'],
  testTimeout: 30000,
  rootDir: '.',
  testMatch: ['<rootDir>/dist/**/*.test.js'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/integration/auth.integration.test.ts',
  ],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/dist/__tests__/setupTests.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)$': '$1',
  },
  transform: {},
  moduleDirectories: ['node_modules', 'dist'],
};
