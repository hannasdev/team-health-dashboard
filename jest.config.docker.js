module.exports = {
  verbose: true,
  bail: 1,
  moduleFileExtensions: ['js'],
  rootDir: './dist',
  testTimeout: 30000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/*.test.js'],
      testEnvironment: 'node',
      testPathIgnorePatterns: ['<rootDir>/e2e/'],
      setupFiles: ['<rootDir>/setupTests.js'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/e2e/**/*.e2e.test.js'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/setupTests.js'],
    },
  ],
};
