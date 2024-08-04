import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['webpack.config.cjs'],
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: eslintPluginImport,
    },
    rules: {
      'import/order': [
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
      // Add other rules here
    },
    settings: {
      'import/parsers': {
        espree: ['.js', '.cjs', '.mjs'],
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  prettierConfig,
];
