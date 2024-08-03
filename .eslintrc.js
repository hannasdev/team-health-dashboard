export default {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // Node "builtin" modules (like `fs`, `path`)
          'external', // "external" modules (npm packages like `lodash`)
          'internal', // "internal" modules (using `paths` from `tsconfig.json`)
          ['parent', 'sibling', 'index'], // Parent, sibling, and index
          'object', // Object imports (like `import {foo} from 'bar'`)
          'type', // Type imports (only types in TypeScript)
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
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': [
      'error',
      {
        tryExtensions: ['.ts', '.js', '.json', '.node'],
      },
    ],
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: [],
        convertPath: null,
        tryExtensions: ['.ts', '.js', '.json', '.node'],
      },
    ],
  },
  settings: {
    node: {
      tryExtensions: ['.ts', '.js', '.json', '.node'],
    },
  },
};
