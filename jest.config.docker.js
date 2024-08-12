export default {
  verbose: true,
  moduleFileExtensions: ['js'],
  testTimeout: 30000,
  rootDir: '.',
  testMatch: ['<rootDir>/dist/**/*.test.js'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/dist/setupTests.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)$': '$1',
  },
  transform: {},
  moduleDirectories: ['node_modules', 'dist'],
};
