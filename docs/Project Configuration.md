# Project Configuration

This project is written in Typescript. It is a backend application, using express and Jest for testing.

We use webpack for building the production bundle. It uses tsc for type checking and transpilation of typescript into javascript.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es2022", // Latest ECMAScript version suitable for Node.js 22.16
    "module": "commonjs", // Use CommonJS modules
    "moduleResolution": "node", // Node.js module resolution
    "esModuleInterop": true, // Interop between CommonJS and ES modules
    "strict": true, // Enable strict type checking
    "skipLibCheck": true, // Skip type-checking .d.ts files
    "forceConsistentCasingInFileNames": true, // Consistent casing in file names
    "outDir": "./dist", // Output directory for compiled files
    "rootDir": "./src", // Root directory for input files
    "baseUrl": ".", // Base URL for module resolution
    "paths": { "@/*": ["src/*"] }, // Alias for module resolution
    "sourceMap": true, // Enable source maps
    "typeRoots": ["./node_modules/@types", "./src/types"], // Custom type roots
    "types": ["node"] // Include Node.js type definitions
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/**/*.ts", // Unit and integration tests
    "src/types/**/*.d.ts" // Custom type declaration files
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "*.config.js",
    "*.config.ts",
    ".eslintrc.cjs", // ESLint config file
    "e2e/**/*.ts", // Exclude E2E tests
    "**/*.spec.ts", // Optionally exclude test files
    "**/*.test.ts" // Optionally exclude test files
  ]
}
```

## .eslintrc.cjs

```js
{
  module.exports = {
    root: true,
    env: {
      browser: false, // Not needed for backend
      node: true, // Node environment
      es2022: true, // Latest ECMAScript version supported by Node 22.16
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:import-x/typescript',
      'plugin:import-x/errors',
      'plugin:import-x/warnings',
      'prettier',
    ],
    ignorePatterns: [
      'dist',
      'node_modules',
      '.eslintrc.cjs',
      'build',
      'e2e/**', // Ignore E2E test files
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
    },
    plugins: ['@typescript-eslint', 'import-x', 'prettier'],
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error',
    },
    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts', '.mjs', '.cjs'],
        },
      },
    },
    overrides: [
      {
        files: ['**/*.{ts,tsx}'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          project: './tsconfig.json',
          tsconfigRootDir: __dirname,
        },
      },
      {
        files: ['**/*.{js,mjs,cjs}'],
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
    ],
  };
}
```

## jest.config.js

```cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  rootDir: './',
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  // Add a separate configuration for e2e tests if needed
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/**/*.test.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['**/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['./setupTests.js'],
      // Use custom Docker setup for MongoDB
    },
  ],
};
```

## webpack.config.cjs

```cjs
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  externals: [nodeExternals()], // Exclude node_modules from the bundle
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false, // Disable minification for easier debugging
  },
};
```
