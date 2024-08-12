# Project Configuration

This project is written in Typescript. It is a backend application, using express and Jest for testing.

We don't need webpack or babel, as we are not delivering any assets and this is a pure backend API. The Node environment can run modern Javascript.

## Typescript

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022", // Latest ECMAScript version suitable for Node.js 22.16
    "module": "ES2020", // Use ES2020 modules
    "moduleResolution": "node", // Node.js module resolution
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true, // Interop between CommonJS and ES modules
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strict": true, // Enable strict type checking
    "skipLibCheck": true, // Skip type-checking .d.ts files
    "forceConsistentCasingInFileNames": true, // Consistent casing in file names
    "outDir": "./dist", // Output directory for compiled files
    "rootDir": "./src", // Root directory for input files
    "baseUrl": "./src", // Base URL for module resolution
    "sourceMap": true, // Enable source maps
    "typeRoots": ["./node_modules/@types", "./src/types"], // Custom type roots
    "types": ["jest", "node"] // Include Node.js type definitions
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
    "*.config.js",
    ".eslintrc.cjs" // ESLint config file
  ]
}
```

## ESlint

`.eslintrc.cjs`

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

## Jest

`jest.config.ts`

```typescript
import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  bail: 1, // stops testing once 1 fail
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
```

We have a separate file, `jest.config.docker.js`, for use inside Docker. The purpose is to reduce memory and improve speed, by avoiding the transpilation step.

```js
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
      testMatch: ['<rootDir>/e2e/**/*.e2e.spec.js'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/setupTests.js'],
    },
  ],
};
```

## Docker

- Docker is used to create isolated environments for the application, databases, and test runners.
- The application is built using a multi-stage Dockerfile, optimizing for size and security.
- Unit tests and E2E tests are run in separate Docker containers.
- The main application and test databases are separated to avoid conflicts.
- Jest is configured to run TypeScript tests locally and JavaScript tests in Docker.
- The build process compiles TypeScript to JavaScript, which is then used for testing in Docker.
- Environment variables are used to configure the application and tests for different environments.
- Volume mounts are used to persist data and share node_modules.
- Health checks are implemented to ensure services are ready before dependent services start.

### Key ideas behind the setup

- Separation of concerns: Each service (app, db, tests) runs in its own container.
- Performance optimization: Running tests on compiled JavaScript in Docker for faster execution.
- Flexibility: Maintaining the ability to run TypeScript tests locally for development.
- Isolation: Using separate databases for the main application and tests.
- Resource management: Specifying memory limits for each service.
- Consistency: Using the same Node.js version across all containers.
- Caching: Leveraging Docker's layer caching to speed up builds.

`Dockerfile`

```Dockerfile
# Base Stage
FROM node:20.16.0-alpine AS base
RUN mkdir -p /home/nodejs/app && chown -R node:node /home/nodejs
WORKDIR /home/nodejs/app

# Dependencies Stage
FROM base AS dependencies
USER node
COPY --chown=node:node package*.json ./
RUN npm ci

# Build Stage
FROM dependencies AS build
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node ./src ./src
RUN npm run build

# Unit Test Stage
FROM build AS unit-test
COPY --chown=node:node jest.config.docker.js ./
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.js", "--testMatch", "**/dist/**/*.test.js"]

# E2E Test Stage
FROM build AS e2e-test
COPY --chown=node:node jest.config.docker.js ./
CMD ["node", "--experimental-vm-modules", "node_modules/.bin/jest", "--config", "jest.config.js", "--testMatch", "**/dist/**/*.e2e.spec.js"]

# Production Stage
FROM base AS production
ENV NODE_ENV=production
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --chown=node:node --from=build /home/nodejs/app/dist ./dist
# Create logs directory with correct permissions
RUN mkdir -p logs && chown node:node logs

# Set environment variables
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "./dist/index.js"]
```

## Docker Compose

`docker-compose.yml`

```yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://root:example@db:27017/myapp?authSource=admin
    env_file:
      - .env
    deploy:
      resources:
        limits:
          memory: 2G
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s
    volumes:
      - node_modules:/app/node_modules

  db:
    image: mongo:8
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongodb.js:/docker-entrypoint-initdb.d/init-mongodb.js:ro
    command: mongod --bind_ip_all
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=example
    deploy:
      resources:
        limits:
          memory: 2G
    ports:
      - '27017:27017'

  unit-test-runner:
    build:
      context: .
      target: unit-test
    deploy:
      resources:
        limits:
          memory: 2G
    command:
      - node
      - --experimental-vm-modules
      - node_modules/.bin/jest
      - --config
      - jest.config.js
      - --testMatch
      - '**/dist/**/*.test.js'

  e2e-test-runner:
    build:
      context: .
      target: e2e-test
    env_file:
      - .env.test
    environment:
      - DATABASE_URL=mongodb://root:example@db-test:27017/myapp-test?authSource=admin
      - GOOGLE_SHEETS_ID=test-id
      - GOOGLE_SHEETS_CLIENT_EMAIL=test-user
      - GOOGLE_SHEETS_PRIVATE_KEY=test-key
      - GITHUB_TOKEN=test-github-token
      - GITHUB_OWNER=test-user
      - GITHUB_REPO=test-org/test-repo
      - CORS_ORIGIN=http://localhost:3000,null
    depends_on:
      - db-test
    deploy:
      resources:
        limits:
          memory: 3G
    command:
      - sh
      - -c
      - |
        npx wait-on http://app:3000/health --timeout 30000 &&
        node --experimental-vm-modules node_modules/.bin/jest --config jest.config.js --testMatch "**/dist/**/*.e2e.spec.js"

  db-test:
    image: mongo:8
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongodb.js:/docker-entrypoint-initdb.d/init-mongodb.js:ro
    command: mongod --bind_ip_all
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=example
    deploy:
      resources:
        limits:
          memory: 2G
    ports:
      - '27018:27017'

volumes:
  mongodb_data:
  node_modules:
```
