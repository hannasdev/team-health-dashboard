# webpack.config.cjs

```cjs
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  target: 'node',
  externals: [nodeExternals()],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      maxSize: 244000,
    },
    concatenateModules: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new BundleAnalyzerPlugin(),
  ],
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};
```

# tsconfig.json

```json
{
  "ts-node": {
    "compilerOptions": {
      "rootDir": "./",
      "module": "ESNext",
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    },
    "transpileOnly": true,
    "files": true,
    "esm": true,
    "experimentalSpecifierResolution": "node"
  },
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "checkJs": true,
    "declaration": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "noImplicitAny": true,
    "outDir": "./dist",
    "resolveJsonModule": true,
    "rootDir": "./",
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "target": "ES2020",
    "types": ["reflect-metadata", "jest", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "jest.setup.ts"],
  "exclude": ["node_modules", "./dist"]
}
```

# package.json

```json
{
  "name": "team-health-dashboard",
  "version": "1.0.0",
  "description": "",
  "main": "dist/server.js",
  "type": "module",
  "sideEffects": false,
  "scripts": {
    "start": "node --experimental-specifier-resolution=node dist/index.js",
    "build": "npx tsc",
    "prod": "webpack --config webpack.config.cjs",
    "dev": "node --loader ts-node/esm src/index.ts",
    "test:inband": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --testTimeout=30000 src/__tests__/services/GitHubService.test.ts",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch --verbose --detectOpenHandles",
    "lint": "eslint 'src/**/*.{ts,js}'",
    "lint:fix": "eslint 'src/**/*.{ts,js}' --fix",
    "prettier": "prettier --write 'src/**/*.{ts,js,json,md}'",
    "tokenize": "npx ai-digest"
  },
  "dependencies": {
    "@octokit/graphql": "^8.1.1",
    "@octokit/rest": "^21.0.1",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "googleapis": "^140.0.1",
    "inversify": "^6.0.2",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.8.0",
    "reflect-metadata": "^0.2.2",
    "uuid": "^10.0.0",
    "winston": "^3.13.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.8.0",
    "@octokit/types": "^13.5.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/mongodb": "^4.0.6",
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "clean-webpack-plugin": "^4.0.0",
    "concurrently": "^8.2.2",
    "eslint": "^9.8.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-import": "^2.29.1",
    "globals": "^15.8.0",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.0.0",
    "nodemon": "^3.1.4",
    "terser-webpack-plugin": "^5.3.10",
    "ts-jest": "^29.2.3",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.4",
    "typescript-eslint": "^7.17.0",
    "webpack": "^5.93.0",
    "webpack-bundle-analyzer": "^4.10.2",
    "webpack-cli": "^5.1.4",
    "webpack-node-externals": "^3.0.0"
  }
}
```

# nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "concurrently \"npx tsc --watch\" \"ts-node src/index.ts\""
}
```

# jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

# jest.setup.ts

```ts
// jest.setup.ts
import 'reflect-metadata';
import { jest } from '@jest/globals';

global.jest = jest;
```

# jest.config.js

```js
// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  maxWorkers: 4,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleDirectories: ['node_modules', 'src'],
  roots: ['<rootDir>'],
};
```

# eslint.config.js

```js
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
```

# docker-compose.yml

```yml
services:
  app:
    build: .
    ports:
      - '3000:3000'
    depends_on:
      - db
    environment:
      - DATABASE_URL=mongodb://db:27017/myapp
      - NODE_ENV=production
      - JWT_SECRET=your_jwt_secret_here

  db:
    image: mongo:4.4
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongodb.js:/docker-entrypoint-initdb.d/init-mongodb.js
    command: mongod --bind_ip_all

volumes:
  mongodb_data:
```

# README.md

```md
# Team Health Dashboard

Gathers information from your github repository and from your google sheet, to render a dashboard with relevant team statistics.

## Development

Utilises the MVC-pattern with dependency injection and inversion of control for improved testability.

\`\`\`md
src/
index.ts
app.ts
container.ts
controllers/
MetricsController.ts
interfaces/
IDataService.ts
IGutHubService.ts
IGoogleSheetsService.ts
IMetricModel.ts
IMetricsService.ts
middleware/
...
models/
Metric.ts
routes/
metrics.ts
services/
GitHubService.ts
GoogleSheetsService.ts
MetricsService.ts
\`\`\`
```

# Dockerfile

```
# Use an official Node runtime as the parent image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

RUN npm install mongodb

# Bundle app source inside the docker image
COPY . .

# Build the app
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "start" ]
```

# .prettierrc

```
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}

```

# .gitignore

```
# Dependency directories
node_modules/

# Build output
dist/

# Environment variables
.env

# Logs
logs
*.log
npm-debug.log*

# Operating System Files
.DS_Store
Thumbs.db

# IDE Files
.vscode/
.idea/

# Test coverage
coverage/

solar-imprint.json
```

# .aidigestignore

```
solar-imprint.json
package-lock.json
docs/
dist/
node_modules/
```

# src/loadEnv.ts

```ts
// src/loadEnv.ts
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Log environment variables (for debugging, remove in production)
console.log('Environment variables:');
console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log(
  'GOOGLE_SHEETS_API_KEY:',
  process.env.GOOGLE_SHEETS_API_KEY ? 'Set' : 'Not set',
);
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'Set' : 'Not set');
console.log('GITHUB_OWNER:', process.env.GITHUB_OWNER);
console.log('GITHUB_REPO:', process.env.GITHUB_REPO);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || '*');
```

# src/index.ts

```ts
// src/index.ts
import 'reflect-metadata';
import './loadEnv'; // This should be the first import
import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
```

# src/container.ts

```ts
/**
 * Dependency Injection Container
 *
 * This file sets up the InversifyJS container for dependency injection
 * across the Team Health Dashboard application. It binds interfaces to their
 * implementations for services, controllers, and utilities.
 *
 * Key components:
 * - Configuration
 * - Logging
 * - Error Handling
 * - Data Services (Google Sheets, GitHub)
 * - Metrics Service and Controller
 * - Caching Service
 *
 * When adding new dependencies:
 * 1. Import the necessary types and implementations
 * 2. Add a new binding using container.bind<Interface>(TYPES.InterfaceType).to(Implementation)
 *
 * @module Container
 */

import { Container } from 'inversify';

import { ILogger } from '@/interfaces';

import { GitHubAdapter } from './adapters/GitHubAdapter';
import { GoogleSheetsAdapter } from './adapters/GoogleSheetAdapter';
import { config } from './config/config';
import { AuthController } from './controllers/AuthController';
import { MetricsController } from './controllers/MetricsController';
import { ErrorHandler } from './middleware/ErrorHandler';
import { GitHubRepository } from './repositories/github/GitHubRepository';
import { UserRepository } from './repositories/user/UserRepository';
import { CacheService } from './services/cache/CacheService';
import { GitHubService } from './services/github/GitHubService';
import { GoogleSheetsService } from './services/googlesheets/GoogleSheetsService';
import { MetricCalculator } from './services/metrics/MetricsCalculator';
import { MetricsService } from './services/metrics/MetricsService';
import { ProgressTracker } from './services/progress/ProgressTracker';
import { Logger } from './utils/Logger';
import { TYPES } from './utils/types';

import type {
  ICacheService,
  IConfig,
  IErrorHandler,
  IGitHubClient,
  IGitHubRepository,
  IGitHubService,
  IGoogleSheetsClient,
  IGoogleSheetsService,
  IMetricCalculator,
  IMetricsService,
  IProgressTracker,
} from './interfaces';

const container = new Container();

// Config
container.bind<IConfig>(TYPES.Config).toConstantValue(config);

// Logger
container.bind<ILogger>(TYPES.Logger).to(Logger);
container.bind<string>(TYPES.LogLevel).toConstantValue(config.LOG_LEVEL);
container.bind<string>(TYPES.LogFormat).toConstantValue(config.LOG_FORMAT);

// ErrorHandler
container.bind<IErrorHandler>(TYPES.ErrorHandler).to(ErrorHandler);

// CacheService
container.bind<ICacheService>(TYPES.CacheService).to(CacheService);

// GoogleSheets
container
  .bind<IGoogleSheetsClient>(TYPES.GoogleSheetsClient)
  .to(GoogleSheetsAdapter);
container
  .bind<IGoogleSheetsService>(TYPES.GoogleSheetsService)
  .to(GoogleSheetsService);

// GitHub
container.bind<IGitHubClient>(TYPES.GitHubClient).to(GitHubAdapter);
container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService);
container.bind<IGitHubRepository>(TYPES.GitHubRepository).to(GitHubRepository);

// Metrics
container.bind<IMetricCalculator>(TYPES.MetricCalculator).to(MetricCalculator);
container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
container
  .bind<MetricsController>(TYPES.MetricsController)
  .to(MetricsController);

// Progress Tracking
container.bind<IProgressTracker>(TYPES.ProgressTracker).to(ProgressTracker);

container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);

export { container };
```

# src/app.ts

```ts
// src/app.ts
import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import metricsRouter from './routes/metrics';
import authRouter from './routes/auth';
import { container } from './container';
import { config } from './config/config';

const app: Express = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.CORS_ORIGIN.split(',');
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.send('Team Health Dashboard API');
});

// Use the metrics router
app.use('/api', metricsRouter);

// Use the auth router
app.use('/api/auth', authRouter);

export default app;
```

# scripts/init-mongodb.js

```js
print('Starting initialization script');

db = db.getSiblingDB('myapp');

if (!db.getCollectionNames().includes('users')) {
  print('Creating users collection');
  db.createCollection('users');
} else {
  print('Users collection already exists');
}

if (!db.getCollectionNames().includes('metrics')) {
  print('Creating metrics collection');
  db.createCollection('metrics', {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metric_name',
      granularity: 'minutes',
    },
  });
  print('Creating index on metrics collection');
  db.metrics.createIndex({ metric_category: 1, metric_name: 1, timestamp: 1 });
} else {
  print('Metrics collection already exists');
}

print('Initialization script completed');
```

# public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SSE Test</title>
  </head>
  <body>
    <div id="messages"></div>

    <script>
      function connect() {
        const eventSource = new EventSource(
          'http://localhost:3000/api/metrics',
        );

        eventSource.onopen = function () {
          console.log('Connection to server opened.');
        };

        eventSource.onerror = function (error) {
          console.error('EventSource failed:', error);
          eventSource.close();
          setTimeout(connect, 5000); // Try to reconnect after 5 seconds
        };

        eventSource.onmessage = function (event) {
          const message = JSON.parse(event.data);
          document.getElementById('messages').innerHTML += `<p>${JSON.stringify(
            message,
          )}</p>`;
        };

        eventSource.addEventListener('progress', function (event) {
          const progress = JSON.parse(event.data);
          console.log('Progress:', progress);
        });

        eventSource.addEventListener('result', function (event) {
          const result = JSON.parse(event.data);
          console.log('Result:', result);
          eventSource.close();
        });

        eventSource.addEventListener('error', function (event) {
          const error = JSON.parse(event.data);
          console.error('Error:', error);
          eventSource.close();
        });
      }

      connect();
    </script>
  </body>
</html>
```

# src/utils/types.ts

```ts
/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  AuthController: Symbol.for('AuthController'),
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  CacheService: Symbol.for('CacheService'),
  Config: Symbol.for('Config'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  GitHubClient: Symbol.for('GitHubClient'),
  GitHubRepository: Symbol.for('GitHubRepository'),
  GitHubService: Symbol.for('GitHubService'),
  GoogleSheetsClient: Symbol.for('GoogleSheetsClient'),
  GoogleSheetsService: Symbol.for('GoogleSheetsService'),
  LogFormat: Symbol.for('LogFormat'),
  LogLevel: Symbol.for('LogLevel'),
  Logger: Symbol.for('Logger'),
  MetricCalculator: Symbol.for('MetricCalculator'),
  MetricsController: Symbol.for('MetricsController'),
  MetricsService: Symbol.for('MetricsService'),
  ProgressTracker: Symbol.for('ProgressTracker'),
  UserRepository: Symbol.for('UserRepository'),
};
```

# src/utils/Logger.ts

```ts
// src/utils/Logger.ts
import path from 'path';

import { injectable, inject } from 'inversify';
import winston from 'winston';

import { config } from '../config/config';
import { ILogger } from '../interfaces/ILogger';
import { TYPES } from '../utils/types';

@injectable()
export class Logger implements ILogger {
  private logger: winston.Logger;

  constructor(
    @inject(TYPES.LogLevel) private logLevel: string,
    @inject(TYPES.LogFormat) private logFormat: string,
  ) {
    this.logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        this.logFormat === 'json'
          ? winston.format.json()
          : winston.format.simple(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(config.LOG_FILE_PATH, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(config.LOG_FILE_PATH, 'combined.log'),
        }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}
```

# src/utils/CacheDecorator.ts

```ts
// src/utils/CacheDecorator.ts
import { inject, injectable } from 'inversify';

import type { ICacheService } from '@/interfaces/ICacheService';

import { TYPES } from './types';

export function Cacheable(cacheKey: string, duration: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any).cacheService as ICacheService;

      if (!cacheService) {
        console.warn(
          'CacheService not found. Cacheable decorator may not work as expected.',
        );
        return originalMethod.apply(this, args);
      }

      const key = `${cacheKey}-${JSON.stringify(args)}`;
      const cachedResult = cacheService.get(key);

      if (cachedResult) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cacheService.set(key, result, duration);

      return result;
    };

    return descriptor;
  };
}

@injectable()
export class CacheableClass {
  constructor(
    @inject(TYPES.CacheService) protected cacheService: ICacheService,
  ) {}
}
```

# src/utils/CacheDecorator.test.ts

```ts
import { ICacheService } from '@/interfaces/ICacheService';
import { Cacheable, CacheableClass } from '@/utils/CacheDecorator';

describe('CacheDecorator', () => {
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICacheService>;
  });

  describe('Cacheable', () => {
    it('should return cached result if available', async () => {
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass(mockCacheService);
      const cachedResult = 'Cached result';
      mockCacheService.get.mockReturnValue(cachedResult);

      const result = await instance.testMethod('test');

      expect(result).toBe(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith('test-key-["test"]');
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should call original method and cache result if not cached', async () => {
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass(mockCacheService);
      mockCacheService.get.mockReturnValue(null);

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(mockCacheService.get).toHaveBeenCalledWith('test-key-["test"]');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test-key-["test"]',
        'Result for test',
        3600,
      );
    });

    it('should handle missing cacheService gracefully', async () => {
      class TestClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(consoleSpy).toHaveBeenCalledWith(
        'CacheService not found. Cacheable decorator may not work as expected.',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('CacheableClass', () => {
    it('should inject cacheService', () => {
      class TestClass extends CacheableClass {}

      const instance = new TestClass(mockCacheService);

      expect((instance as any).cacheService).toBe(mockCacheService);
    });
  });
});
```

# src/types/index.ts

```ts
// src/types/index.ts
export type ProgressCallback = (
  current: number,
  total: number,
  message: string,
) => void;
```

# src/services/BaseService.ts

```ts
// BaseService.ts
// Abstract Class
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import { Logger } from '../utils/Logger';
import type { ICacheService } from '../interfaces/index';

@injectable()
export abstract class BaseService {
  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.CacheService) protected cacheService: ICacheService,
  ) {}

  protected abstract getCacheKey(params: any): string;

  protected async getDataWithCache<T>(
    cacheKey: string,
    fetchFunction: () => Promise<T>,
    expirationTime: number = 3600, // 1 hour default
  ): Promise<T> {
    const cachedData = this.cacheService.get<T>(cacheKey);
    if (cachedData) {
      this.logger.info(`Retrieved data from cache for key: ${cacheKey}`);
      return cachedData;
    }

    const data = await fetchFunction();
    this.cacheService.set(cacheKey, data, expirationTime);
    return data;
  }
}
```

# src/routes/metrics.ts

```ts
// src/routes/metrics.ts
import express, { Response } from 'express';

import { MetricsController } from '@/controllers/MetricsController';
import { IAuthRequest } from '@/interfaces';
import { authMiddleware } from '@/middleware/AuthMiddleware';

import { container } from '../container';
import { TYPES } from '../utils/types';

const router = express.Router();
const metricsController = container.get<MetricsController>(
  TYPES.MetricsController,
);

router.get('/metrics', authMiddleware, (req: IAuthRequest, res: Response) => {
  // Set necessary headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client closed connection');
  });

  // Parse time period from query params, default to 90 days if not provided
  const timePeriod = parseInt(req.query.timePeriod as string) || 90;

  metricsController.getAllMetrics(req, res, timePeriod);
});

export default router;
```

# src/routes/auth.ts

```ts
// src/routes/auth.ts
import express from 'express';

import { container } from '../container';
import { AuthController } from '../controllers/AuthController';
import { TYPES } from '../utils/types';

const router = express.Router();
const authController = container.get<AuthController>(TYPES.AuthController);

router.post('/login', authController.login);
router.post('/register', authController.register);

export default router;
```

# src/middleware/ErrorHandler.ts

```ts
// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { Logger } from '../utils/Logger';
import { TYPES } from '../utils/types';

@injectable()
export class ErrorHandler {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  handle(err: Error, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('An error occurred', err as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
```

# src/middleware/AuthMiddleware.ts

```ts
// src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { IAuthRequest } from './../interfaces/IAuthRequest';
import { config } from '../config/config';

export const authMiddleware = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = (req.headers as any).authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

# src/middleware/AuthMiddleware.test.ts

```ts
// src/middleware/AuthMiddleware.test.ts
import { IncomingHttpHeaders } from 'http';

import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

import {
  createMockAuthRequest,
  createMockAuthMiddlewareResponse,
} from '@/__mocks__/mockFactories';
import { config } from '@/config/config';
import { IAuthRequest } from '@/interfaces';
import { authMiddleware } from '@/middleware/AuthMiddleware';

jest.mock('jsonwebtoken');

describe('AuthMiddleware', () => {
  let mockRequest: IAuthRequest;
  let mockResponse: Response;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = createMockAuthRequest();
    mockResponse = createMockAuthMiddlewareResponse();
    nextFunction = jest.fn();
    jest.resetAllMocks();
  });

  it('should call next() if a valid token is provided', () => {
    const user = { id: '1', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    } as IncomingHttpHeaders;
    jest.spyOn(jwt, 'verify').mockReturnValue(user as any);

    authMiddleware(mockRequest, mockResponse, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith('valid_token', config.JWT_SECRET);
    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    authMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'No token provided',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if an invalid token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    } as IncomingHttpHeaders;
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(mockRequest, mockResponse, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith('invalid_token', config.JWT_SECRET);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
```

# src/models/User.ts

```ts
export class User {
  constructor(
    public id: string,
    public email: string,
    public password: string,
  ) {}
}
```

# src/models/Metric.ts

```ts
// src/models/Metric.ts
import type { IMetric } from '@/interfaces/IMetricModel';

export class Metric implements IMetric {
  constructor(
    public id: string,
    public metric_category: string,
    public metric_name: string,
    public value: number,
    public timestamp: Date,
    public unit: string,
    public additional_info: string,
    public source: string,
  ) {}
}
```

# src/controllers/MetricsController.ts

```ts
// src/controllers/MetricsController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

import type { IMetricsService } from '../interfaces';

/**
 * MetricsController
 *
 * This controller handles HTTP requests related to metrics in the Team Health Dashboard.
 * It acts as an intermediary between the HTTP layer and the MetricsService,
 * processing requests, managing Server-Sent Events (SSE) for progress updates,
 * and formatting the final response.
 *
 * Key responsibilities:
 * - Handles the getAllMetrics endpoint
 * - Manages SSE for real-time progress updates
 * - Processes and formats the response from MetricsService
 * - Handles errors and sends appropriate error responses
 *
 * @injectable
 */
@injectable()
export class MetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  /**
   * Handles the GET request for all metrics.
   * This method sets up Server-Sent Events (SSE) for progress updates and
   * fetches metrics using the MetricsService.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {number} timePeriod - The time period in days for which to fetch metrics.
   * @returns {Promise<void>}
   *
   * @throws Will pass any errors from MetricsService to the client via SSE.
   */
  public getAllMetrics = async (
    req: Request,
    res: Response,
    timePeriod: number,
  ): Promise<void> => {
    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const progressCallback: ProgressCallback = (
      current: number,
      total: number,
      message: string,
    ) => {
      sendEvent('progress', {
        progress: Math.min(Math.round((current / total) * 100), 100),
        message,
      });
    };

    try {
      const result = await this.metricsService.getAllMetrics(
        progressCallback,
        timePeriod,
      );

      sendEvent('result', {
        success: true,
        data: result.metrics,
        errors: result.errors,
        githubStats: result.githubStats,
        status: result.errors.length > 0 ? 207 : 200,
      });
    } catch (error) {
      this.logger.error('Error in MetricsController:', error as Error);
      sendEvent('error', {
        success: false,
        errors: [
          {
            source: 'MetricsController',
            message:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
          },
        ],
        status: 500,
      });
    } finally {
      res.end();
    }
  };
}
```

# src/controllers/MetricsController.test.ts

```ts
// src/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { MetricsController } from '@/controllers/MetricsController';
import type { IMetricsService, IMetric, ILogger } from '@/interfaces';
import type { Request, Response } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Logger } from '@/utils/Logger';
import { createMockLogger } from '@/__mocks__/mockFactories';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockLogger: ILogger;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLogger = createMockLogger();
    mockMetricsService = {
      getAllMetrics: jest.fn(),
    };
    metricsController = new MetricsController(
      mockMetricsService,
      mockLogger as Logger,
    );
    mockRequest = {
      query: {},
    };
    mockResponse = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as Partial<Response>;
  });

  describe('getAllMetrics', () => {
    it('should send progress events and a final result event', async () => {
      const mockMetrics: IMetric[] = [
        {
          id: '1',
          metric_category: 'Efficiency',
          metric_name: 'Metric1',
          value: 10,
          timestamp: new Date(),
          unit: 'points',
          additional_info: '',
          source: 'Source1',
        },
      ];

      mockMetricsService.getAllMetrics.mockImplementation(
        async (progressCallback, timePeriod) => {
          progressCallback?.(0, 100, 'Starting');
          progressCallback?.(50, 100, 'Halfway');
          progressCallback?.(100, 100, 'Completed');
          return {
            metrics: mockMetrics,
            errors: [],
            githubStats: { totalPRs: 10, fetchedPRs: 10, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":0,"message":"Starting"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":50,"message":"Halfway"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":100,"message":"Completed"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: result\ndata: {"success":true,"data":'),
      );
    });

    it('should handle errors and send an error event', async () => {
      const mockError = new Error('Test error');
      mockMetricsService.getAllMetrics.mockRejectedValue(mockError);

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: error\ndata: {"success":false,"errors":[{"source":"MetricsController","message":"Test error"}],"status":500}',
        ),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in MetricsController:',
        mockError,
      );
    });

    it('should call progress callback correctly', async () => {
      const mockProgressCallback = jest.fn();

      mockMetricsService.getAllMetrics.mockImplementation(
        async (callback, timePeriod) => {
          callback?.(0, 100, 'Starting');
          callback?.(50, 100, 'Halfway');
          callback?.(100, 100, 'Completed');
          return {
            metrics: [],
            errors: [],
            githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":0,"message":"Starting"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":50,"message":"Halfway"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":100,"message":"Completed"}',
        ),
      );
    });
  });
});
```

# src/controllers/AuthController.ts

```ts
// src/controllers/AuthController.ts
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { config } from '../config/config';
import { UserRepository } from '../repositories/user/UserRepository';
import { TYPES } from '../utils/types';

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userRepository.create(email, hashedPassword);
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      res.status(201).json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
```

# src/controllers/AuthController.test.ts

```ts
// src/controllers/AuthController.test.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
  createMockUserRepository,
  createMockExpressRequest,
  createMockAuthControllerResponse,
} from '@/__mocks__/mockFactories';
import { config } from '@/config/config';
import { AuthController } from '@/controllers/AuthController';
import { UserRepository } from '@/repositories/user/UserRepository';

jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    authController = new AuthController(mockUserRepository);
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return a token', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

      mockUserRepository.findByEmail.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mockToken' as never);

      await authController.register(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        'test@example.com',
        'hashedPassword',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        config.JWT_SECRET,
        {
          expiresIn: '1h',
        },
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
    });

    it('should return 400 if user already exists', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'existing@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
        password: 'hashedPassword',
      });

      await authController.register(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User already exists',
      });
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mockToken' as never);

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
    });

    it('should return 401 for invalid credentials', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
      });
      const mockResponse = createMockAuthControllerResponse();

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
    });
  });
});
```

# src/**mocks**/mockFactories.ts

```ts
// @/__mocks__/mockFactories.ts
import { IncomingHttpHeaders } from 'http';

import { Request, Response } from 'express';

import {
  IGitHubRepository,
  IGitHubService,
  IMetricCalculator,
  IGoogleSheetsService,
  IMetricsService,
  IProgressTracker,
  IConfig,
  IPullRequest,
  IMetric,
  ILogger,
  IFetchDataResult,
  IAuthRequest,
} from '@/interfaces';
import { UserRepository } from '@/repositories/user/UserRepository';

export function createMockGitHubRepository(): jest.Mocked<IGitHubRepository> {
  return {
    fetchPullRequests: jest.fn().mockResolvedValue([]),
  };
}

export function createMockMetricCalculator(): jest.Mocked<IMetricCalculator> {
  return {
    calculateMetrics: jest.fn().mockReturnValue([]),
  };
}

export function createMockProgressTracker(): jest.Mocked<IProgressTracker> {
  return {
    trackProgress: jest.fn(),
    setReportInterval: jest.fn(),
  };
}

export function createMockConfig(): jest.Mocked<IConfig> {
  return {
    GOOGLE_SHEETS_CLIENT_EMAIL: 'google_sheets_client_email_test',
    GOOGLE_SHEETS_PRIVATE_KEY: 'google_sheets_privat_key_test',
    GOOGLE_SHEETS_ID: 'google_sheets_id_test',
    GITHUB_TOKEN: 'github_token_test',
    GITHUB_OWNER: 'github_owner_test',
    GITHUB_REPO: 'github_repo_test',
    PORT: 3000,
  };
}

export function createMockLogger(): jest.Mocked<ILogger> {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

// Helper function to create mock pull requests
export function createMockPullRequest(
  overrides: Partial<IPullRequest> = {},
): IPullRequest {
  return {
    id: 1,
    number: 1,
    title: 'Test PR',
    state: 'closed',
    user: { login: 'testuser' },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    closed_at: '2023-01-03T00:00:00Z',
    merged_at: '2023-01-03T00:00:00Z',
    commits: 1,
    additions: 10,
    deletions: 5,
    changed_files: 2,
    base: { ref: 'main', sha: 'base-sha' },
    head: { ref: 'feature', sha: 'head-sha' },
    ...overrides,
  };
}

// Helper function to create mock metrics
export function createMockMetric(overrides: Partial<IMetric> = {}): IMetric {
  return {
    id: 'test-metric',
    value: 10,
    unit: 'count',
    metric_category: 'test category',
    metric_name: 'test metric',
    additional_info: '',
    source: '',
    timestamp: new Date(), // Changed from empty string to new Date()
    ...overrides,
  };
}

export const createMockMetricsService = (): jest.Mocked<IMetricsService> => ({
  getAllMetrics: jest.fn().mockResolvedValue({ metrics: [], errors: [] }),
});

export const createCacheDecoratorMock = () => {
  const cacheable = jest.fn().mockImplementation(() => jest.fn());

  class MockCacheableClass {
    constructor(public cacheService: any) {}
  }

  return {
    Cacheable: cacheable,
    CacheableClass: MockCacheableClass,
  };
};

export function createMockGoogleSheetsService(): jest.Mocked<IGoogleSheetsService> {
  return {
    fetchData: jest.fn<
      Promise<IMetric[]>,
      [((progress: number, message: string) => void)?]
    >(),
  };
}

export function createMockGitHubService(): jest.Mocked<IGitHubService> {
  return {
    fetchData: jest.fn<
      Promise<IFetchDataResult>,
      [((current: number, total: number, message: string) => void)?, number?]
    >(),
  };
}

export function createMockRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  const req: Partial<IAuthRequest> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as IAuthRequest;
}

export const createMockResponse = () => {
  const res: Partial<Response> = {
    type: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    format: jest.fn(),
    get: jest.fn(),
    links: jest.fn().mockReturnThis(),
    location: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn(),
    set: jest.fn().mockReturnThis(),
    vary: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attachment: jest.fn().mockReturnThis(),
    contentType: jest.fn().mockReturnThis(),
    download: jest.fn(),
    headersSent: false,
    locals: {},
    charset: '',
  };

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res as Response;
};

export function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

export function createMockAuthRequest(
  overrides: Partial<IAuthRequest> = {},
): IAuthRequest {
  const req: Partial<IAuthRequest> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as IAuthRequest;
}

export function createMockExpressRequest(
  overrides: Partial<Request> = {},
): Request {
  const req: Partial<Request> = {
    headers: {} as IncomingHttpHeaders,
    ...overrides,
  };
  return req as Request;
}

export const createMockAuthControllerResponse = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const res: Partial<Response> = {
    status,
    json,
  };
  return res as Response;
};

export const createMockAuthMiddlewareResponse = () => {
  const json = jest.fn().mockReturnThis();
  const res: Partial<Response> = {
    status: jest.fn().mockReturnValue({ json }),
    json,
  };
  return res as Response;
};
```

# src/**mocks**/externalMocks.ts

```ts
// src/__mocks__/externalMocks.ts
import { jest } from '@jest/globals';
import { Octokit } from '@octokit/rest';

export const createMockOctokit = (): jest.Mocked<Octokit> => {
  return {
    paginate: jest.fn(),
    rest: {
      pulls: {
        list: jest.fn(),
      },
    },
    request: jest.fn(),
    graphql: jest.fn(),
    log: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as jest.Mocked<Octokit>;
};
```

# src/adapters/GoogleSheetAdapter.ts

```ts
// GoogleSheetsAdapter.ts
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { injectable, inject } from 'inversify';

import { TYPES } from '../utils/types';

import type { IGoogleSheetsClient, IConfig } from '../interfaces';

@injectable()
export class GoogleSheetsAdapter implements IGoogleSheetsClient {
  private sheets;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.sheets = google.sheets({
      version: 'v4',
      auth: this.getAuth(),
    });
  }

  private getAuth(): OAuth2Client {
    return new google.auth.JWT({
      email: this.config.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: this.config.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  async getValues(spreadsheetId: string, range: string): Promise<any> {
    return this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
  }
}
```

# src/adapters/GitHubAdapter.ts

```ts
// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import { injectable, inject } from 'inversify';

import { TYPES } from '../utils/types';

import type { IGitHubClient, IConfig } from '../interfaces';

/**
 * GitHubAdapter
 *
 * This adapter implements the IGitHubClient interface using Octokit,
 * the official GitHub REST API client. It provides methods for
 * paginated requests and general API requests to GitHub.
 *
 * @implements {IGitHubClient}
 */
@injectable()
export class GitHubAdapter implements IGitHubClient {
  private octokit: Octokit;
  private graphqlWithAuth: typeof graphql;

  /**
   * Creates an instance of GitHubAdapter.
   * @param {IConfig} config - The configuration object containing the GitHub token
   */
  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.octokit = new Octokit({
      auth: this.config.GITHUB_TOKEN,
    });
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${this.config.GITHUB_TOKEN}`,
      },
    });
  }

  /**
   * Sends a request to the GitHub API.
   * @param {string} route - The API route to request
   * @param {RequestParameters} [params] - Additional parameters for the request
   * @returns {Promise<any>} A promise that resolves with the API response
   */
  async request(route: string, options?: any): Promise<any> {
    return this.octokit.request(route, options);
  }

  async graphql(query: string, variables?: any): Promise<any> {
    return this.graphqlWithAuth(query, variables);
  }
}
```

# src/config/config.ts

```ts
// src/config/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
  GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID!,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
  GITHUB_OWNER: process.env.GITHUB_OWNER!,
  GITHUB_REPO: process.env.GITHUB_REPO!,
  PORT: process.env.PORT || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*', // Default to all origins if not set
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'mongodb://localhost:27017/team-heath-dashboard',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs',
};

// Optional: Validate config
Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
});
```

# src/interfaces/index.ts

```ts
export type { IAuthRequest } from './IAuthRequest';
export type { ICacheService } from './ICacheService';
export type { IConfig } from './IConfig';
export type { IDataService } from './IDataService';
export type { IErrorHandler } from './IErrorHandler';
export type { IFetchDataResult } from './IFetchDataResult';
export type { IGitHubClient } from './IGitHubClient';
export type { IGitHubRepository } from './IGitHubRepository';
export type { IGitHubService } from './IGitHubService';
export type { IGoogleSheetsClient } from './IGoogleSheetsClient';
export type { IGoogleSheetsService } from './IGoogleSheetsService';
export type { IGraphQLResponse } from './IGraphQLResponse';
export type { ILogger } from './ILogger';
export type { IMetric } from './IMetricModel';
export type { IMetricCalculator } from './IMetricCalculator';
export type { IMetricsService } from './IMetricsService';
export type { IProgressTracker } from './IProgressTracker';
export type { IPullRequest } from './IPullRequest';
```

# src/interfaces/IPullRequest.ts

```ts
/**
 * Represents a Pull Request in GitHub.
 */
export interface IPullRequest {
  id: number;

  number: number;

  title: string;

  /** The current state of the pull request (open, closed, merged) */
  state: 'open' | 'closed' | 'merged';

  /** The login of the user who created the pull request */
  user: {
    login: string;
  };

  created_at: string;

  updated_at: string;

  /** The date and time when the pull request was closed (if applicable) */
  closed_at: string | null;

  /** The date and time when the pull request was merged (if applicable) */
  merged_at: string | null;

  /** The number of commits in the pull request */
  commits: number;

  /** The number of added lines in the pull request */
  additions: number;

  /** The number of deleted lines in the pull request */
  deletions: number;

  /** The number of changed files in the pull request */
  changed_files: number;

  /** The base branch of the pull request */
  base: {
    ref: string;
    sha: string;
  };

  /** The head branch of the pull request */
  head: {
    ref: string;
    sha: string;
  };
}
```

# src/interfaces/IProgressTracker.ts

```ts
// src/services/progress/IProgressTracker.ts
export interface IProgressTracker {
  trackProgress: (current: number, total: number, message: string) => void;
  setReportInterval: (interval: number) => void;
}
```

# src/interfaces/IMetricsService.ts

```ts
// src/interfaces/IMetricsService.ts
import type { ProgressCallback } from '@/types';

import type { IMetric } from './IMetricModel';

export interface IMetricsService {
  getAllMetrics(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }>;
}
```

# src/interfaces/IMetricModel.ts

```ts
// src/interfaces/IMetricModel.ts

export interface IMetric {
  id: string;
  metric_category: string;
  metric_name: string;
  value: number;
  timestamp: Date;
  unit: string;
  additional_info: string;
  source: string;
}
```

# src/interfaces/IMetricCalculator.ts

```ts
// src/services/metrics/IMetricCalculator.ts
import type { IMetric } from './IMetricModel';
import type { IPullRequest } from './IPullRequest';

export interface IMetricCalculator {
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[];
}
```

# src/interfaces/ILogger.ts

```ts
// src/interfaces/ILogger.ts

export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
```

# src/interfaces/IGraphQLResponse.ts

```ts
// src/interfaces/IGraphQLResponse.ts
export interface IGraphQLResponse {
  repository: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: Array<{
        number: number;
        title: string;
        state: string;
        author: { login: string } | null;
        createdAt: string;
        updatedAt: string;
        closedAt: string | null;
        mergedAt: string | null;
        commits: { totalCount: number };
        additions: number;
        deletions: number;
        changedFiles: number;
        baseRefName: string;
        baseRefOid: string;
        headRefName: string;
        headRefOid: string;
      }>;
    };
  };
}
```

# src/interfaces/IGoogleSheetsService.ts

```ts
// src/interfaces/IGoogleSheetsService.ts
import { IMetric } from './IMetricModel';

export interface IGoogleSheetsService {
  fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]>;
}
```

# src/interfaces/IGoogleSheetsClient.ts

```ts
// src/interfaces/IGoogleSheetsClient.ts
export interface IGoogleSheetsClient {
  getValues(
    spreadsheetId: string,
    range: string,
  ): Promise<{
    data: {
      values: any[][];
    };
  }>;
}
```

# src/interfaces/IGitHubService.ts

```ts
// src/interfaces/IGitHubService.ts
import { ProgressCallback } from '@/types';

import { IFetchDataResult } from './IFetchDataResult';

export interface IGitHubService {
  fetchData(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<IFetchDataResult>;
}
```

# src/interfaces/IGitHubRepository.ts

```ts
// src/interfaces/IGitHubRepository.ts
import { ProgressCallback } from '@/types';

import { IPullRequest } from './IPullRequest';

export interface IGitHubRepository {
  fetchPullRequests: (
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ) => Promise<IPullRequest[]>;
}
```

# src/interfaces/IGitHubClient.ts

```ts
// src/interfaces/IGitHubClient.ts
import { RequestParameters } from '@octokit/types';

export interface IGitHubClient {
  request: (route: string, params?: RequestParameters) => Promise<any>;
  graphql(query: string, variables?: any): Promise<any>;
}
```

# src/interfaces/IFetchDataResult.ts

```ts
import { IMetric } from './IMetricModel';

/**
 * Represents the result of fetching GitHub data.
 */
export interface IFetchDataResult {
  /** The calculated metrics */
  metrics: IMetric[];

  /** The total number of pull requests */
  totalPRs: number;

  /** The number of pull requests actually fetched */
  fetchedPRs: number;

  /** The time period (in days) for which the data was fetched */
  timePeriod: number;
}
```

# src/interfaces/IErrorHandler.ts

```ts
// src/interfaces/IErrorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface IErrorHandler {
  handle(err: Error, req: Request, res: Response, next: NextFunction): void;
}
```

# src/interfaces/IDataService.ts

```ts
// src/interfaces/IDataService.ts
import { IMetric } from './IMetricModel';

export interface IDataService {
  fetchData(startDate?: Date, endDate?: Date): Promise<IMetric[]>;
}
```

# src/interfaces/IConfig.ts

```ts
// src/interfaces/IConfig.ts
export interface IConfig {
  GOOGLE_SHEETS_CLIENT_EMAIL: string;
  GOOGLE_SHEETS_PRIVATE_KEY: string;
  GOOGLE_SHEETS_ID: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  PORT: number | string;
}
```

# src/interfaces/ICacheService.ts

```ts
// src/interfaces/ICacheService.ts
export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}
```

# src/interfaces/IAuthRequest.ts

```ts
// src/interfaces/IAuthRequest.ts
import { IncomingHttpHeaders } from 'http';

import { Request } from 'express';

export interface IAuthRequest extends Request {
  headers: IncomingHttpHeaders;
  user?: { id: string; email: string };
}
```

# src/utils/**mocks**/CacheDecorator.ts

```ts
export const Cacheable = jest.fn().mockImplementation(() => jest.fn());

export class CacheableClass {
  constructor(protected cacheService: any) {}
}
```

# src/services/progress/ProgressTracker.ts

```ts
// src/services/progress/ProgressTracker.ts
import { inject, injectable } from 'inversify';

import { IProgressTracker } from '../../interfaces/IProgressTracker';
import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';

@injectable()
export class ProgressTracker implements IProgressTracker {
  private lastReportTime: number = 0;
  private reportInterval: number = 1000; // 1 second

  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  trackProgress(current: number, total: number, message: string): void {
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportInterval || current === total) {
      const progress = Math.min((current / total) * 100, 100);
      this.logger.info(
        `${message} - Progress: ${progress.toFixed(2)}% (${current}/${total})`,
      );
      this.lastReportTime = now;
    }
  }

  setReportInterval(interval: number): void {
    this.reportInterval = interval;
  }
}

export interface ProgressCallback {
  (current: number, total: number, message: string): void;
}

export function createProgressCallback(
  tracker: IProgressTracker,
): ProgressCallback {
  return (current: number, total: number, message: string) => {
    tracker.trackProgress(current, total, message);
  };
}
```

# src/services/progress/ProgressTracker.test.ts

```ts
import { createProgressCallback } from '@/services/progress/ProgressTracker';
import { Logger } from '@/utils/Logger';
import { ProgressTracker } from '@/services/progress/ProgressTracker';
import { IProgressTracker } from '@/interfaces';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockLogger = { info: jest.fn() } as unknown as jest.Mocked<Logger>;
    progressTracker = new ProgressTracker(mockLogger);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('trackProgress', () => {
    it('should log progress at the specified interval', () => {
      progressTracker.trackProgress(50, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      progressTracker.trackProgress(75, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      progressTracker.trackProgress(90, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should always log progress when current equals total', () => {
      progressTracker.trackProgress(99, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      progressTracker.trackProgress(100, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('setReportInterval', () => {
    it('should change the report interval', () => {
      progressTracker.setReportInterval(2000);

      progressTracker.trackProgress(50, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      progressTracker.trackProgress(75, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      progressTracker.trackProgress(90, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });
});

describe('createProgressCallback', () => {
  it('should create a callback function that calls trackProgress', () => {
    const mockTracker: IProgressTracker = {
      trackProgress: jest.fn(),
      setReportInterval: jest.fn(),
    };

    const callback = createProgressCallback(mockTracker);
    callback(50, 100, 'Processing');

    expect(mockTracker.trackProgress).toHaveBeenCalledWith(
      50,
      100,
      'Processing',
    );
  });
});
```

# src/services/metrics/MetricsService.ts

```ts
// src/services/MetricsService.ts
import { ProgressCallback } from '@interfaces/types';
import { injectable, inject } from 'inversify';

import type {
  IMetricsService,
  IMetric,
  IGoogleSheetsService,
  IGitHubService,
} from '@/interfaces/index';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

/**
 * MetricsService
 *
 * This service acts as the main orchestrator for collecting and aggregating
 * metrics data for the Team Health Dashboard. It coordinates data retrieval
 * from various sources, primarily GitHub and Google Sheets, through their
 * respective services.
 *
 * The service is responsible for:
 * - Initiating data collection from multiple sources
 * - Aggregating metrics from different services
 * - Handling errors and partial data retrieval gracefully
 * - Providing a unified interface for accessing all metrics
 * - Supporting progress tracking across all data collection processes
 *
 * It uses the GitHubService and GoogleSheetsService to fetch specific metrics,
 * combines their results, and handles any errors that occur during the process.
 * The service also manages the overall progress reporting, giving clients
 * a clear view of the data collection status.
 *
 * @implements {IMetricsService}
 */
@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  /**
   * Fetches all metrics from various sources and aggregates them.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for reporting progress.
   * @param {number} [timePeriod=90] - Time period in days for which to fetch metrics (default is 90 days).
   * @returns {Promise<{metrics: IMetric[]; errors: {source: string; message: string}[]; githubStats: {totalPRs: number; fetchedPRs: number; timePeriod: number}}>}
   *          A promise that resolves to an object containing:
   *          - metrics: An array of deduplicated metrics from all sources.
   *          - errors: An array of errors encountered during data fetching, if any.
   *          - githubStats: Statistics about the GitHub data fetch, including total PRs, fetched PRs, and the time period.
   * @throws Will throw an error if both data sources fail to fetch data.
   */
  async getAllMetrics(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }> {
    const errors: { source: string; message: string }[] = [];
    let allMetrics: IMetric[] = [];
    let githubStats = { totalPRs: 0, fetchedPRs: 0, timePeriod };

    const createGoogleSheetsProgressCallback = (
      source: string,
      offset: number,
    ) => {
      return (progress: number, message: string) => {
        const adjustedProgress = offset + (progress / 100) * 50;
        progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
      };
    };

    const createGitHubProgressCallback = (
      source: string,
      offset: number,
    ): ProgressCallback => {
      return (current: number, total: number, message: string) => {
        const adjustedProgress = offset + (current / total) * 50;
        progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
      };
    };

    try {
      progressCallback?.(0, 100, 'Google Sheets: Starting to fetch data');
      const googleSheetsData = await this.googleSheetsService.fetchData(
        createGoogleSheetsProgressCallback('Google Sheets', 0),
      );
      allMetrics = [...allMetrics, ...googleSheetsData];
      progressCallback?.(50, 100, 'Google Sheets: Finished fetching data');
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      progressCallback?.(50, 100, 'GitHub: Starting to fetch data');
      const githubData = await this.gitHubService.fetchData(
        createGitHubProgressCallback('GitHub', 50),
        timePeriod,
      );
      allMetrics = [...allMetrics, ...githubData.metrics];
      githubStats = {
        totalPRs: githubData.totalPRs,
        fetchedPRs: githubData.fetchedPRs,
        timePeriod: githubData.timePeriod,
      };
      progressCallback?.(100, 100, 'GitHub: Finished fetching data');
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const uniqueMetrics = this.deduplicateMetrics(allMetrics);

    return { metrics: uniqueMetrics, errors, githubStats };
  }

  /**
   * Deduplicates an array of metrics based on their IDs.
   * If there are multiple metrics with the same ID, the one with the latest timestamp is kept.
   *
   * @private
   * @param {IMetric[]} metrics - The array of metrics to deduplicate.
   * @returns {IMetric[]} An array of deduplicated metrics.
   */
  private deduplicateMetrics(metrics: IMetric[]): IMetric[] {
    const metricMap = new Map<string, IMetric>();

    for (const metric of metrics) {
      const existingMetric = metricMap.get(metric.id);
      if (!existingMetric || existingMetric.timestamp < metric.timestamp) {
        metricMap.set(metric.id, metric);
      }
    }

    return Array.from(metricMap.values());
  }
}
```

# src/services/metrics/MetricsService.test.ts

```ts
// src/__tests__/services/metrics/MetricsService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import {
  createMockLogger,
  createMockGoogleSheetsService,
  createMockGitHubService,
  createMockMetric,
} from '@/__mocks__/mockFactories';
import type { IMetricsService, IMetric } from '@/interfaces';
import { MetricsService } from '@/services/metrics/MetricsService';
import { Logger } from '@/utils/Logger';

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsService: ReturnType<typeof createMockGoogleSheetsService>;
  let mockGitHubService: ReturnType<typeof createMockGitHubService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGoogleSheetsService = createMockGoogleSheetsService();
    mockGitHubService = createMockGitHubService();
    mockLogger = createMockLogger() as unknown as jest.Mocked<Logger>;
    metricsService = new MetricsService(
      mockGoogleSheetsService,
      mockGitHubService,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
      const mockSheetMetric = createMockMetric({
        id: 'sheet-metric',
        source: 'Google Sheets',
      });
      const mockGitHubMetric = createMockMetric({
        id: 'github-metric',
        source: 'GitHub',
      });

      const mockSheetMetrics: IMetric[] = [mockSheetMetric];
      const mockGitHubResult = {
        metrics: [mockGitHubMetric],
        totalPRs: 10,
        fetchedPRs: 10,
        timePeriod: 90,
      };

      mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
      mockGitHubService.fetchData.mockResolvedValue(mockGitHubResult);

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics).toEqual(
        expect.arrayContaining([mockSheetMetric, mockGitHubMetric]),
      );
      expect(result.errors).toHaveLength(0);
      expect(result.githubStats).toEqual({
        totalPRs: 10,
        fetchedPRs: 10,
        timePeriod: 90,
      });

      // Check if progress callback was called
      expect(mockProgressCallback).toHaveBeenCalledTimes(4);
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        1,
        0,
        100,
        'Google Sheets: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        2,
        50,
        100,
        'Google Sheets: Finished fetching data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        3,
        50,
        100,
        'GitHub: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        4,
        100,
        100,
        'GitHub: Finished fetching data',
      );
    });

    it('should handle errors from Google Sheets service', async () => {
      mockGoogleSheetsService.fetchData.mockRejectedValue(
        new Error('Google Sheets API error'),
      );
      mockGitHubService.fetchData.mockResolvedValue({
        metrics: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        source: 'Google Sheets',
        message: 'Google Sheets API error',
      });
    });

    it('should handle errors from GitHub service', async () => {
      mockGoogleSheetsService.fetchData.mockResolvedValue([]);
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        source: 'GitHub',
        message: 'GitHub API error',
      });
    });

    it('should handle errors from both services with progress updates', async () => {
      mockGoogleSheetsService.fetchData.mockRejectedValue(
        new Error('Google Sheets API error'),
      );
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { source: 'Google Sheets', message: 'Google Sheets API error' },
          { source: 'GitHub', message: 'GitHub API error' },
        ]),
      );

      expect(mockProgressCallback).toHaveBeenCalledWith(
        0,
        100,
        'Google Sheets: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        50,
        100,
        'GitHub: Starting to fetch data',
      );
    });

    it('should log errors from services', async () => {
      const googleSheetsError = new Error('Google Sheets API error');
      const gitHubError = new Error('GitHub API error');

      mockGoogleSheetsService.fetchData.mockRejectedValue(googleSheetsError);
      mockGitHubService.fetchData.mockRejectedValue(gitHubError);

      await metricsService.getAllMetrics();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching Google Sheets data:',
        googleSheetsError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        gitHubError,
      );
    });

    it('should deduplicate metrics from different sources', async () => {
      const sheetMetric = {
        id: 'metric-1',
        metric_category: 'Test Category',
        metric_name: 'Test Metric',
        value: 10,
        timestamp: new Date(2023, 0, 1),
        unit: 'count',
        additional_info: 'Sheet info',
        source: 'Google Sheets',
      };

      const githubMetric = {
        ...sheetMetric,
        value: 20,
        timestamp: new Date(2023, 0, 2),
        additional_info: 'GitHub info',
        source: 'GitHub',
      };

      mockGoogleSheetsService.fetchData.mockResolvedValue([sheetMetric]);
      mockGitHubService.fetchData.mockResolvedValue({
        metrics: [githubMetric],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0]).toEqual(githubMetric); // The GitHub metric should be chosen as it has a later timestamp
    });

    it("should handle case where one service returns data and the other doesn't", async () => {
      const mockSheetMetrics: IMetric[] = [
        {
          id: 'sheet-1',
          metric_category: 'Test Category',
          metric_name: 'Test Metric',
          value: 10,
          timestamp: new Date(),
          unit: 'count',
          additional_info: 'Test info',
          source: 'Google Sheets',
        },
      ];
      mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toEqual(mockSheetMetrics);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('GitHub');
    });

    it.each([
      [new Date(2023, 0, 1), new Date(2023, 0, 2), 'GitHub'],
      [new Date(2023, 0, 2), new Date(2023, 0, 1), 'Google Sheets'],
    ])(
      'should choose metric with latest timestamp when deduplicating',
      async (date1, date2, expectedSource) => {
        const sheetMetric: IMetric = {
          id: 'metric-1',
          metric_category: 'Test Category',
          metric_name: 'Test Metric',
          value: 10,
          timestamp: date1,
          unit: 'count',
          additional_info: 'Test info',
          source: 'Google Sheets',
        };
        const githubMetric: IMetric = {
          ...sheetMetric,
          timestamp: date2,
          source: 'GitHub',
        };

        mockGoogleSheetsService.fetchData.mockResolvedValue([sheetMetric]);
        mockGitHubService.fetchData.mockResolvedValue({
          metrics: [githubMetric],
          totalPRs: 1,
          fetchedPRs: 1,
          timePeriod: 90,
        });

        const result = await metricsService.getAllMetrics();

        expect(result.metrics).toHaveLength(1);
        expect(result.metrics[0].source).toBe(expectedSource);
      },
    );

    it('should handle timeouts gracefully', async () => {
      jest.useFakeTimers();
      const timeoutError = new Error('Timeout');

      mockGoogleSheetsService.fetchData.mockRejectedValue(timeoutError);
      mockGitHubService.fetchData.mockRejectedValue(timeoutError);

      const getAllMetricsPromise = metricsService.getAllMetrics();

      jest.runAllTimers();

      const result = await getAllMetricsPromise;

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toEqual({
        source: 'Google Sheets',
        message: 'Timeout',
      });
      expect(result.errors[1]).toEqual({
        source: 'GitHub',
        message: 'Timeout',
      });

      jest.useRealTimers();
    });
  });
});
```

# src/services/metrics/MetricsCalculator.ts

```ts
// src/services/metrics/MetricCalculator.ts
import { injectable } from 'inversify';

import type {
  IMetric,
  IMetricCalculator,
  IPullRequest,
} from '@/interfaces/index';

/**
 * MetricCalculator
 *
 * This class is responsible for calculating various metrics based on pull request data.
 * It implements the IMetricCalculator interface and provides methods to calculate
 * PR cycle time and PR size metrics.
 *
 * @implements {IMetricCalculator}
 */
@injectable()
export class MetricCalculator implements IMetricCalculator {
  /**
   * Calculates all metrics for the given pull requests.
   *
   * @param {IPullRequest[]} pullRequests - An array of pull requests to calculate metrics for.
   * @returns {IMetric[]} An array of calculated metrics.
   */
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[] {
    return [
      this.calculatePRCycleTime(pullRequests),
      this.calculatePRSize(pullRequests),
    ];
  }

  /**
   * Calculates the average cycle time for pull requests.
   * Cycle time is defined as the time between PR creation and merge.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetric} The PR cycle time metric.
   */
  private calculatePRCycleTime(pullRequests: IPullRequest[]): IMetric {
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);
    const averageCycleTime =
      mergedPRs.length > 0
        ? mergedPRs.reduce((sum, pr) => {
            const createdAt = new Date(pr.created_at);
            const mergedAt = new Date(pr.merged_at!);
            return (
              sum +
              (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
            );
          }, 0) / mergedPRs.length
        : 0;

    return {
      id: 'github-pr-cycle-time',
      metric_category: 'Efficiency',
      metric_name: 'PR Cycle Time',
      value: Math.round(averageCycleTime),
      timestamp: new Date(),
      unit: 'hours',
      additional_info: `Based on ${mergedPRs.length} merged PRs`,
      source: 'GitHub',
    };
  }

  /**
   * Calculates the average size of pull requests.
   * Size is defined as the sum of additions and deletions.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetric} The PR size metric.
   */
  private calculatePRSize(pullRequests: IPullRequest[]): IMetric {
    const averageSize =
      pullRequests.length > 0
        ? pullRequests.reduce(
            (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
            0,
          ) / pullRequests.length
        : 0;

    return {
      id: 'github-pr-size',
      metric_category: 'Code Quality',
      metric_name: 'PR Size',
      value: Math.round(averageSize),
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }
}
```

# src/services/metrics/MetricCalculator.test.ts

```ts
import type { IPullRequest } from '@/interfaces';
import { MetricCalculator } from '@/services/metrics/MetricsCalculator';

describe('MetricCalculator', () => {
  let calculator: MetricCalculator;

  beforeEach(() => {
    calculator = new MetricCalculator();
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics', () => {
      const pullRequests: IPullRequest[] = [
        {
          created_at: '2023-01-01T00:00:00Z',
          merged_at: '2023-01-02T00:00:00Z',
          additions: 10,
          deletions: 5,
        },
        {
          created_at: '2023-01-03T00:00:00Z',
          merged_at: '2023-01-05T00:00:00Z',
          additions: 20,
          deletions: 15,
        },
      ] as IPullRequest[];

      const metrics = calculator.calculateMetrics(pullRequests);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github-pr-cycle-time');
      expect(metrics[1].id).toBe('github-pr-size');
    });
  });

  describe('calculatePRCycleTime', () => {
    it('should calculate average cycle time correctly', () => {
      const pullRequests: IPullRequest[] = [
        {
          created_at: '2023-01-01T00:00:00Z',
          merged_at: '2023-01-02T00:00:00Z',
        },
        {
          created_at: '2023-01-03T00:00:00Z',
          merged_at: '2023-01-05T00:00:00Z',
        },
      ] as IPullRequest[];

      const metric = (calculator as any).calculatePRCycleTime(pullRequests);

      expect(metric.value).toBe(36); // (24 + 48) / 2 = 36 hours
      expect(metric.unit).toBe('hours');
      expect(metric.additional_info).toBe('Based on 2 merged PRs');
    });

    it('should handle empty pull requests array', () => {
      const metric = (calculator as any).calculatePRCycleTime([]);

      expect(metric.value).toBe(0);
      expect(metric.additional_info).toBe('Based on 0 merged PRs');
    });
  });

  describe('calculatePRSize', () => {
    it('should calculate average PR size correctly', () => {
      const pullRequests: IPullRequest[] = [
        { additions: 10, deletions: 5 },
        { additions: 20, deletions: 15 },
      ] as IPullRequest[];

      const metric = (calculator as any).calculatePRSize(pullRequests);

      expect(metric.value).toBe(25); // (15 + 35) / 2 = 25 lines
      expect(metric.unit).toBe('lines');
      expect(metric.additional_info).toBe('Based on 2 PRs');
    });

    it('should handle empty pull requests array', () => {
      const metric = (calculator as any).calculatePRSize([]);

      expect(metric.value).toBe(0);
      expect(metric.additional_info).toBe('Based on 0 PRs');
    });
  });
});
```

# src/services/googlesheets/GoogleSheetsService.ts

```ts
// src/services/googlesheets/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';

import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';
import { BaseService } from '../BaseService';

import type {
  IGoogleSheetsClient,
  IGoogleSheetsService,
  IConfig,
  ICacheService,
  IMetric,
} from '../../interfaces';

/**
 * GoogleSheetsService
 *
 * This service is responsible for fetching and processing data from Google Sheets
 * as part of the Team Health Dashboard. It extends the BaseService to leverage
 * common functionality such as caching and logging.
 *
 * The service fetches data from a specified Google Sheets document, processes
 * the rows into metrics, and caches the results for improved performance.
 * It supports progress tracking through a callback mechanism.
 *
 * @extends BaseService
 * @implements IGoogleSheetsService
 */
@injectable()
export class GoogleSheetsService
  extends BaseService
  implements IGoogleSheetsService
{
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(logger, cacheService);
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
    if (!this.spreadsheetId) {
      this.logger.error('Google Sheets ID is not set correctly');
    }
  }

  protected getCacheKey(): string {
    return `googlesheets-${this.spreadsheetId}`;
  }

  async fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]> {
    const cacheKey = this.getCacheKey();
    return this.getDataWithCache(
      cacheKey,
      () => this.fetchGoogleSheetsData(progressCallback),
      3600, // 1 hour cache
    );
  }

  private async fetchGoogleSheetsData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]> {
    try {
      progressCallback?.(0, 'Starting to fetch data from Google Sheets');

      const response = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:F', // This range is correct for the new structure
      );

      progressCallback?.(
        50,
        'Data fetched from Google Sheets, processing rows',
      );

      const rows = response.data.values;

      if (!rows || rows.length <= 1) {
        progressCallback?.(100, 'No data found in Google Sheets');
        return [];
      }

      // Skip the header row
      const metrics = rows
        .slice(1)
        .map((row: any[], index: number) => {
          if (row.length < 4) {
            this.logger.warn(`Skipping row with insufficient data: ${row}`);
            return null;
          }

          const [
            timestamp,
            metric_category,
            metric_name,
            value,
            unit = '',
            additional_info = '',
          ] = row;

          if (
            !timestamp ||
            !metric_category ||
            !metric_name ||
            value === undefined
          ) {
            this.logger.warn(
              `Skipping row with missing essential data: ${row}`,
            );
            return null;
          }

          return {
            id: `sheet-${index}`,
            metric_category,
            metric_name,
            value: Number(value),
            timestamp: new Date(timestamp),
            unit,
            additional_info,
            source: 'Google Sheets',
          };
        })
        .filter((metric: IMetric | null): metric is IMetric => metric !== null);

      progressCallback?.(100, 'Finished processing Google Sheets data');
      return metrics;
    } catch (error) {
      this.logger.error(
        'Error fetching data from Google Sheets:',
        error as Error,
      );
      progressCallback?.(100, 'Error fetching data from Google Sheets');
      throw new Error(
        `Failed to fetch data from Google Sheets: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
```

# src/services/googlesheets/GoogleSheetsService.test.ts

```ts
// src/__tests__/services/GoogleSheetsService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import { createMockLogger } from '@/__mocks__/mockFactories';
import type {
  IGoogleSheetsService,
  IGoogleSheetsClient,
  IConfig,
  ICacheService,
  ILogger,
} from '@/interfaces/index';
import { GoogleSheetsService } from '@/services/googlesheets/GoogleSheetsService';
import { Logger } from '@/utils/Logger';

class MockCacheService implements ICacheService {
  private store: { [key: string]: any } = {};

  get<T>(key: string): T | null {
    return this.store[key] || null;
  }

  set<T>(key: string, value: T): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('GoogleSheetsService', () => {
  let googleSheetsService: IGoogleSheetsService;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockConfig: IConfig;
  let mockLogger: ILogger;
  let mockCacheService: ICacheService;

  beforeEach(() => {
    mockGoogleSheetsClient = {
      getValues: jest.fn(),
    };
    mockConfig = {
      GOOGLE_SHEETS_ID: 'fake-sheet-id',
    } as IConfig;
    mockLogger = createMockLogger();
    mockCacheService = new MockCacheService();
    googleSheetsService = new GoogleSheetsService(
      mockGoogleSheetsClient,
      mockConfig,
      mockLogger as Logger,
      mockCacheService,
    );
  });

  it('should fetch and parse data from Google Sheets', async () => {
    const mockSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      [
        '2023-07-27T10:00:00Z',
        'Efficiency',
        'Cycle Time',
        '3',
        'days',
        'Sprint 1',
      ],
      ['2023-07-27T11:00:00Z', 'Workflow', 'WIP', '5', 'items', ''],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
          unit: 'days',
          additional_info: 'Sprint 1',
          source: 'Google Sheets',
        }),
        expect.objectContaining({
          metric_category: 'Workflow',
          metric_name: 'WIP',
          value: 5,
          unit: 'items',
          additional_info: '',
          source: 'Google Sheets',
        }),
      ]),
    );
  });

  it('should handle empty sheet data', async () => {
    jest.spyOn(mockCacheService, 'get').mockReturnValue(null);
    jest.spyOn(mockCacheService, 'set');
    const mockEmptySheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockEmptySheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(0);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'googlesheets-fake-sheet-id',
      [],
      3600,
    );
  });

  it('should handle rows with missing optional fields', async () => {
    const mockSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow', 'WIP', '5'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
          unit: 'days',
          additional_info: '',
        }),
        expect.objectContaining({
          metric_category: 'Workflow',
          metric_name: 'WIP',
          value: 5,
          unit: '',
          additional_info: '',
        }),
      ]),
    );
  });

  it('should skip rows with missing essential fields', async () => {
    const mockMalformedSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow'],
      ['2023-07-27T12:00:00Z', 'Quality', 'Bug Count', '7', 'bugs'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
        }),
        expect.objectContaining({
          metric_category: 'Quality',
          metric_name: 'Bug Count',
          value: 7,
        }),
      ]),
    );
  });

  it('should log warning for rows with missing essential fields', async () => {
    const mockMalformedSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow'],
      ['2023-07-27T12:00:00Z', 'Quality', 'Bug Count', '7', 'bugs'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    await googleSheetsService.fetchData();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Skipping row with insufficient data: 2023-07-27T11:00:00Z,Workflow',
      ),
    );
  });

  it('should throw an error when failing to fetch data', async () => {
    jest.spyOn(mockCacheService, 'get').mockReturnValue(null);
    jest.spyOn(mockCacheService, 'set');
    mockGoogleSheetsClient.getValues.mockRejectedValue(new Error('API error'));

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      'Failed to fetch data from Google Sheets',
    );
    expect(mockCacheService.set).not.toHaveBeenCalled();
  });

  it('should log error when failing to fetch data', async () => {
    const error = new Error('API error');
    mockGoogleSheetsClient.getValues.mockRejectedValue(error);

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      'Failed to fetch data from Google Sheets',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching data from Google Sheets:',
      error,
    );
  });

  it('should use cached data if available', async () => {
    const cachedData = [
      {
        id: 'sheet-0',
        metric_category: 'Efficiency',
        metric_name: 'Cycle Time',
        value: 3,
        timestamp: new Date('2023-07-27T10:00:00Z'),
        unit: 'days',
        additional_info: 'Sprint 1',
        source: 'Google Sheets',
      },
    ];

    jest.spyOn(mockCacheService, 'get').mockReturnValue(cachedData);

    const result = await googleSheetsService.fetchData();

    expect(result).toEqual(cachedData);
    expect(mockCacheService.get).toHaveBeenCalledWith(
      'googlesheets-fake-sheet-id',
    );
    expect(mockGoogleSheetsClient.getValues).not.toHaveBeenCalled();
  });

  it('should fetch and cache new data when cache is empty', async () => {
    jest.spyOn(mockCacheService, 'get').mockReturnValue(null);
    jest.spyOn(mockCacheService, 'set');

    const mockSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      [
        '2023-07-27T10:00:00Z',
        'Efficiency',
        'Cycle Time',
        '3',
        'days',
        'Sprint 1',
      ],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        metric_category: 'Efficiency',
        metric_name: 'Cycle Time',
        value: 3,
        unit: 'days',
        additional_info: 'Sprint 1',
        source: 'Google Sheets',
      }),
    );
    expect(mockCacheService.set).toHaveBeenCalledWith(
      'googlesheets-fake-sheet-id',
      expect.any(Array),
      3600,
    );
  });
});
```

# src/services/github/GitHubService.ts

```ts
// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';

import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';

import type {
  IMetricCalculator,
  IGitHubRepository,
  IProgressTracker,
  IFetchDataResult,
  IGitHubService,
  IPullRequest,
  IMetric,
} from '../../interfaces/index';
import type { ProgressCallback } from '../../types';

/**
 * GitHubService
 *
 * This service orchestrates the fetching of GitHub data and calculation of metrics.
 * It uses the GitHubRepository to fetch data, the MetricCalculator to compute metrics,
 * and the ProgressTracker to report progress.
 *
 * @implements {IGitHubService}
 */
@injectable()
export class GitHubService implements IGitHubService {
  private readonly MAX_PAGES = 100;
  /**
   * Creates an instance of GitHubService.
   *
   * @param {IGitHubRepository} repository - The repository for fetching GitHub data.
   * @param {IMetricCalculator} metricCalculator - The calculator for computing metrics.
   * @param {IProgressTracker} progressTracker - The tracker for reporting progress.
   * @param {Logger} logger - The logger for recording operations and errors.
   */
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
    @inject(TYPES.ProgressTracker) private progressTracker: IProgressTracker,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  /**
   * Fetches GitHub data and calculates metrics.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   * @param {number} [timePeriod=90] - Time period in days for which to fetch data.
   * @returns {Promise<IFetchDataResult>} The fetched data and calculated metrics.
   * @throws {Error} If data fetching fails.
   */
  async fetchData(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<IFetchDataResult> {
    this.progressTracker.setReportInterval(1000); // Set report interval to 1 second

    if (progressCallback) {
      this.progressTracker.trackProgress = progressCallback;
    }

    try {
      const pullRequests = await this.repository.fetchPullRequests(timePeriod);

      this.progressTracker.trackProgress(50, 100, 'Fetched pull requests');

      const metrics = this.metricCalculator.calculateMetrics(pullRequests);

      this.progressTracker.trackProgress(100, 100, 'Calculated metrics');

      return {
        metrics,
        totalPRs: pullRequests.length,
        fetchedPRs: pullRequests.length,
        timePeriod,
      };
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      throw error;
    }
  }

  /**
   * Fetches all pull requests for the given time period.
   *
   * @private
   * @param {number} timePeriod - Time period in days for which to fetch data.
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   * @returns {Promise<IPullRequest[]>} Array of fetched pull requests.
   */
  private async fetchAllPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    const allPullRequests: IPullRequest[] = [];
    let page = 1;

    while (page <= this.MAX_PAGES) {
      const fetchedPRs = await this.repository.fetchPullRequests(
        timePeriod,
        (current, total, message) => {
          this.trackPageProgress(
            page,
            current,
            total,
            message,
            progressCallback,
          );
        },
      );

      if (!fetchedPRs || fetchedPRs.length === 0) break;
      allPullRequests.push(...fetchedPRs);
      page++;
    }

    return allPullRequests;
  }

  // /**
  //  * Fetches a single page of pull requests.
  //  *
  //  * @private
  //  * @param {number} page - The page number to fetch.
  //  * @param {number} timePeriod - Time period in days for which to fetch data.
  //  * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
  //  * @returns {Promise<IPullRequest[]>} Array of fetched pull requests for the page.
  //  */
  // private async fetchPageOfPullRequests(
  //   page: number,
  //   timePeriod: number,
  //   progressCallback?: ProgressCallback,
  // ): Promise<IPullRequest[]> {
  //   this.logger.info(`Fetching page ${page}`);
  //   return this.repository.fetchPullRequests(timePeriod, (current, total) =>
  //     this.trackPageProgress(page, current, total, progressCallback),
  //   );
  // }

  /**
   * Tracks progress for a single page of pull requests.
   *
   * @private
   * @param {number} page - The current page number.
   * @param {number} current - The current progress within the page.
   * @param {number} total - The total items in the page.
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   */
  private trackPageProgress(
    page: number,
    current: number,
    total: number,
    message: string,
    progressCallback?: ProgressCallback,
  ): void {
    const overallCurrent = (page - 1) * 100 + current;
    const overallTotal = page * 100;

    this.progressTracker.trackProgress(overallCurrent, overallTotal, message);
    progressCallback?.(overallCurrent, overallTotal, message);
  }

  /**
   * Calculates metrics for the given pull requests.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - The pull requests to calculate metrics for.
   * @returns {IMetric[]} Array of calculated metrics.
   */
  private calculateMetrics(pullRequests: IPullRequest[]): IMetric[] {
    this.logger.info(
      `Calculating metrics for ${pullRequests.length} pull requests`,
    );
    return this.metricCalculator.calculateMetrics(pullRequests);
  }

  private createFetchDataResult(
    pullRequests: IPullRequest[],
    metrics: IMetric[],
    timePeriod: number,
  ): IFetchDataResult {
    return {
      metrics,
      totalPRs: pullRequests.length,
      fetchedPRs: pullRequests.length,
      timePeriod,
    };
  }

  /**
   * Handles errors that occur during data fetching.
   *
   * @private
   * @param {unknown} error - The error that occurred.
   * @throws {Error} Always throws an error with a formatted message.
   */
  private handleFetchError(error: unknown): never {
    this.logger.error(
      'Error fetching GitHub data:',
      error instanceof Error ? error : undefined,
    );
    throw new Error(
      `Failed to fetch GitHub data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
```

# src/services/github/GitHubService.test.ts

```ts
import {
  createMockGitHubRepository,
  createMockMetricCalculator,
  createMockLogger,
  createMockPullRequest,
} from '@/__mocks__/mockFactories';
import type {
  IGitHubRepository,
  IGitHubService,
  IMetricCalculator,
  IProgressTracker,
} from '@/interfaces';
import { GitHubService } from '@/services/github/GitHubService';
import { Logger } from '@/utils/Logger';

describe('GitHubService', () => {
  let service: IGitHubService;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;
  let mockProgressTracker: jest.Mocked<IProgressTracker>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockGitHubRepository = createMockGitHubRepository();
    mockMetricCalculator = createMockMetricCalculator();
    mockProgressTracker = {
      setReportInterval: jest.fn(),
      trackProgress: jest.fn(),
    };
    mockLogger = createMockLogger() as unknown as jest.Mocked<Logger>;

    service = new GitHubService(
      mockGitHubRepository,
      mockMetricCalculator,
      mockProgressTracker,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch pull requests and calculate metrics', async () => {
      const mockPRs = [createMockPullRequest(), createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue(mockPRs);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData();

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(90);
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        expect.arrayContaining(mockPRs),
      );
      expect(result.timePeriod).toBe(90); // Default time period
    });

    it('should fetch data with custom time period', async () => {
      const customTimePeriod = 30;
      const mockPRs = [createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue(mockPRs);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData(undefined, customTimePeriod);

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
        customTimePeriod,
      );
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        expect.arrayContaining(mockPRs),
      );
      expect(result.timePeriod).toBe(customTimePeriod);
    });

    it('should use progress callback when provided', async () => {
      const progressCallback = jest.fn();
      mockGitHubRepository.fetchPullRequests.mockResolvedValue([
        createMockPullRequest(),
      ]);

      await service.fetchData(progressCallback);

      expect(mockProgressTracker.setReportInterval).toHaveBeenCalled();
      expect(mockProgressTracker.trackProgress).toHaveBeenCalled();
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalled();

      // Check if the progress callback was used
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle errors during fetch', async () => {
      const errorMessage = 'API Error';
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.fetchData()).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        expect.any(Error),
      );
      expect(mockMetricCalculator.calculateMetrics).not.toHaveBeenCalled();
    });

    it('should handle empty pull request result', async () => {
      mockGitHubRepository.fetchPullRequests.mockResolvedValue([]);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData();

      expect(result).toEqual({
        metrics: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith([]);
    });

    // it('should fetch multiple pages of pull requests', async () => {
    //   const mockPRs1: IPullRequest[] = [
    //     createMockPullRequest(),
    //     createMockPullRequest(),
    //   ];
    //   const mockPRs2: IPullRequest[] = [createMockPullRequest()];
    //   mockRepository.fetchPullRequests
    //     .mockResolvedValueOnce(mockPRs1)
    //     .mockResolvedValueOnce(mockPRs2)
    //     .mockResolvedValueOnce([]);

    //   const result = await service.fetchData();

    //   expect(result.totalPRs).toBe(3);
    //   expect(result.fetchedPRs).toBe(3);
    //   expect(mockRepository.fetchPullRequests).toHaveBeenCalledTimes(1);
    // });
  });
});
```

# src/services/cache/CacheService.ts

```ts
// src/services/cache/CacheService.ts
import { injectable } from 'inversify';

import type { ICacheService } from '@/interfaces/ICacheService';

@injectable()
export class CacheService implements ICacheService {
  private cache: Map<string, any> = new Map();

  get<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

# src/services/cache/CacheService.test.ts

```ts
// src/__tests__/services/CacheService.test.ts
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from '@jest/globals';

import { CacheService } from '@/services/cache/CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  it('should store and retrieve values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    cacheService.set(key, value);
    const retrieved = cacheService.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', () => {
    const retrieved = cacheService.get('nonExistentKey');
    expect(retrieved).toBeNull();
  });

  it('should delete values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    cacheService.set(key, value);
    cacheService.delete(key);

    const retrieved = cacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all values', () => {
    cacheService.set('key1', 'value1');
    cacheService.set('key2', 'value2');

    cacheService.clear();

    expect(cacheService.get('key1')).toBeNull();
    expect(cacheService.get('key2')).toBeNull();
  });

  it('should handle different types of values', () => {
    cacheService.set('stringKey', 'stringValue');
    cacheService.set('numberKey', 123);
    cacheService.set('objectKey', { foo: 'bar' });

    expect(cacheService.get('stringKey')).toBe('stringValue');
    expect(cacheService.get('numberKey')).toBe(123);
    expect(cacheService.get('objectKey')).toEqual({ foo: 'bar' });
  });
});
```

# src/repositories/user/UserRepository.ts

```ts
// src/repositories/user/UserRepository.ts
import { injectable, inject } from 'inversify';
import { MongoClient, Db } from 'mongodb';

import { config } from '@/config/config';
import { User } from '@/models/User';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

@injectable()
export class UserRepository {
  private db!: Db;
  private client!: MongoClient;

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      this.client = await MongoClient.connect(config.DATABASE_URL);
      this.db = this.client.db();
      this.logger.info('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error as Error);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await this.ensureDbConnection();
    try {
      const user = await this.db.collection('users').findOne({ email });
      if (!user) {
        this.logger.debug(`User not found for email: ${email}`);
        return undefined;
      }
      this.logger.debug(`User found for email: ${email}`);
      return new User(user._id.toString(), user.email, user.password);
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${email}`,
        error as Error,
      );
      throw error;
    }
  }

  async create(email: string, password: string): Promise<User> {
    await this.ensureDbConnection();
    try {
      const result = await this.db
        .collection('users')
        .insertOne({ email, password });
      this.logger.info(`New user created with email: ${email}`);
      return new User(result.insertedId.toString(), email, password);
    } catch (error) {
      this.logger.error(
        `Error creating user with email: ${email}`,
        error as Error,
      );
      throw error;
    }
  }

  private async ensureDbConnection() {
    if (!this.db) {
      this.logger.warn(
        'Database connection not initialized, attempting to connect',
      );
      await this.initializeDb();
    }
  }

  // Add a method to close the database connection
  async close() {
    if (this.client) {
      await this.client.close();
      this.logger.info('Database connection closed');
    }
  }
}
```

# src/repositories/user/UserRepository.integration.test.ts

```ts
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { config } from '@/config/config';
import { User } from '@/models/User';
import { UserRepository } from '@/repositories/user/UserRepository';
import { Logger } from '@/utils/Logger';

describe('UserRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let mongoClient: MongoClient;
  let userRepository: UserRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    mongoClient = await MongoClient.connect(mongoUri);
    config.DATABASE_URL = mongoUri;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const db = mongoClient.db();
    await db.collection('users').deleteMany({});
    jest.clearAllMocks();
    userRepository = new UserRepository(mockLogger);
    // Wait for the database connection to be established
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await userRepository.close();
  });

  it('should log successful database connection', async () => {
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully connected to the database',
    );
  });

  it('should log database connection failure', async () => {
    const originalUrl = config.DATABASE_URL;
    config.DATABASE_URL = 'mongodb://invalid:27017';

    const errorRepository = new UserRepository(mockLogger);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Increase wait time

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to connect to the database',
      expect.any(Error),
    );

    config.DATABASE_URL = originalUrl;
    await errorRepository.close();
  });

  it('should create a new user', async () => {
    const email = 'test@example.com';
    const password = 'password123';

    const user = await userRepository.create(email, password);

    expect(user).toBeInstanceOf(User);
    expect(user.email).toBe(email);
    expect(user.password).toBe(password);
    expect(mockLogger.info).toHaveBeenCalledWith(
      `New user created with email: ${email}`,
    );
  });

  it('should find a user by email', async () => {
    const email = 'find@example.com';
    const password = 'findpassword';

    await userRepository.create(email, password);
    const foundUser = await userRepository.findByEmail(email);

    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(email);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      `User found for email: ${email}`,
    );
  });

  it('should return undefined for non-existent user', async () => {
    const nonExistentEmail = 'nonexistent@example.com';
    const nonExistentUser = await userRepository.findByEmail(nonExistentEmail);

    expect(nonExistentUser).toBeUndefined();
    expect(mockLogger.debug).toHaveBeenCalledWith(
      `User not found for email: ${nonExistentEmail}`,
    );
  });
});
```

# src/repositories/github/GitHubRepository.ts

```ts
// src/repositories/github/GitHubRepository.ts
import { injectable, inject } from 'inversify';

import { Cacheable, CacheableClass } from '../../utils/CacheDecorator';
import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';

import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  IPullRequest,
  IGitHubRepository,
} from '../../interfaces';
import type { ProgressCallback } from '../../types';

interface IGraphQLPullRequest {
  number: number;
  title: string;
  state: string;
  author: { login: string } | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  commits: { totalCount: number };
  additions: number;
  deletions: number;
  changedFiles: number;
  baseRefName: string;
  baseRefOid: string;
  headRefName: string;
  headRefOid: string;
}

interface IGraphQLResponse {
  repository: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: IGraphQLPullRequest[];
    };
  };
}

@injectable()
export class GitHubRepository
  extends CacheableClass
  implements IGitHubRepository
{
  private owner: string;
  private repo: string;
  private timeout: number = 300000; // 5 minutes timeout

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
    this.owner = this.configService.GITHUB_OWNER;
    this.repo = this.configService.GITHUB_REPO;
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  @Cacheable('github-prs', 3600) // Cache for 1 hour
  async fetchPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    const { since } = this.getDateRange(timePeriod);
    let pullRequests: IPullRequest[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    const startTime = Date.now();

    try {
      while (hasNextPage) {
        if (Date.now() - startTime > this.timeout) {
          throw new Error('Operation timed out');
        }

        const response: IGraphQLResponse = await this.client.graphql(
          this.getPRQuery(),
          {
            owner: this.owner,
            repo: this.repo,
            cursor: cursor,
          },
        );

        const newPRs = response.repository.pullRequests.nodes.map(
          (node: IGraphQLPullRequest) => this.mapToPullRequest(node),
        );
        pullRequests = [...pullRequests, ...newPRs];

        hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
        cursor = response.repository.pullRequests.pageInfo.endCursor;

        progressCallback?.(
          pullRequests.length,
          Infinity,
          `Fetched ${pullRequests.length} pull requests`,
        );

        // Break if we've gone past the 'since' date
        if (
          newPRs.length > 0 &&
          new Date(newPRs[newPRs.length - 1].created_at) < new Date(since)
        ) {
          break;
        }
      }

      return pullRequests.filter(
        pr => new Date(pr.created_at) >= new Date(since),
      );
    } catch (error) {
      this.logger.error('Error fetching pull requests:', error as Error);
      throw new Error(
        `Failed to fetch pull requests: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private mapToPullRequest(node: IGraphQLPullRequest): IPullRequest {
    return {
      id: node.number,
      number: node.number,
      title: node.title,
      state: this.mapState(node.state),
      user: {
        login: node.author?.login || 'unknown',
      },
      created_at: node.createdAt,
      updated_at: node.updatedAt,
      closed_at: node.closedAt,
      merged_at: node.mergedAt,
      commits: node.commits.totalCount,
      additions: node.additions,
      deletions: node.deletions,
      changed_files: node.changedFiles,
      base: {
        ref: node.baseRefName,
        sha: node.baseRefOid,
      },
      head: {
        ref: node.headRefName,
        sha: node.headRefOid,
      },
    };
  }

  private mapState(state: string): 'open' | 'closed' | 'merged' {
    switch (state.toLowerCase()) {
      case 'open':
        return 'open';
      case 'closed':
        return 'closed';
      case 'merged':
        return 'merged';
      default:
        return 'closed'; // Default to closed if unknown state
    }
  }

  private getPRQuery(): string {
    return `
      query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              title
              state
              author {
                login
              }
              createdAt
              updatedAt
              closedAt
              mergedAt
              commits {
                totalCount
              }
              additions
              deletions
              changedFiles
              baseRefName
              baseRefOid
              headRefName
              headRefOid
            }
          }
        }
      }
    `;
  }

  private getDateRange(timePeriod: number): { since: string; until: string } {
    const now = new Date();
    const since = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000);
    return {
      since: since.toISOString(),
      until: now.toISOString(),
    };
  }
}
```

# src/repositories/github/GitHubRepository.test.ts

```ts
// src/__tests__/repositories/GitHubRepository.test.ts
import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  IPullRequest,
  IGraphQLResponse,
} from '@/interfaces';
import { GitHubRepository } from '@/repositories/github/GitHubRepository';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';

describe('GitHubRepository', () => {
  let repository: GitHubRepository;
  let mockClient: jest.Mocked<IGitHubClient>;
  let mockConfig: jest.Mocked<IConfig>;
  let mockLogger: jest.Mocked<Logger>;
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeAll(() => {
    mockClient = {
      graphql: jest.fn(),
    } as unknown as jest.Mocked<IGitHubClient>;
    mockConfig = {
      GITHUB_OWNER: 'testowner',
      GITHUB_REPO: 'testrepo',
    } as unknown as jest.Mocked<IConfig>;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICacheService>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new GitHubRepository(
      mockClient,
      mockConfig,
      mockLogger,
      mockCacheService,
    );
  });

  describe('fetchPullRequests', () => {
    it('should fetch pull requests for the specified time period', async () => {
      const now = new Date();
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const mockGraphQLResponse: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: [
              {
                number: 1,
                title: 'Test PR 1',
                state: 'OPEN',
                author: { login: 'user1' },
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                closedAt: null,
                mergedAt: null,
                commits: { totalCount: 1 },
                additions: 10,
                deletions: 5,
                changedFiles: 2,
                baseRefName: 'main',
                baseRefOid: 'base-sha',
                headRefName: 'feature',
                headRefOid: 'head-sha',
              },
              {
                number: 2,
                title: 'Test PR 2',
                state: 'CLOSED',
                author: { login: 'user2' },
                createdAt: sixDaysAgo.toISOString(),
                updatedAt: sixDaysAgo.toISOString(),
                closedAt: now.toISOString(),
                mergedAt: now.toISOString(),
                commits: { totalCount: 2 },
                additions: 20,
                deletions: 15,
                changedFiles: 3,
                baseRefName: 'main',
                baseRefOid: 'base-sha-2',
                headRefName: 'feature-2',
                headRefOid: 'head-sha-2',
              },
            ],
          },
        },
      };

      mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

      const result = await repository.fetchPullRequests(7);

      expect(result).toHaveLength(2);
      expect(mockClient.graphql).toHaveBeenCalledWith(
        expect.stringContaining(
          'query($owner: String!, $repo: String!, $cursor: String)',
        ),
        expect.objectContaining({
          owner: 'testowner',
          repo: 'testrepo',
          cursor: null,
        }),
      );
    });

    it('should handle pagination', async () => {
      const now = new Date();
      const mockGraphQLResponse1: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor1',
            },
            nodes: Array(100).fill({
              number: 1,
              title: 'Test PR',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              closedAt: null,
              mergedAt: null,
              commits: { totalCount: 1 },
              additions: 10,
              deletions: 5,
              changedFiles: 2,
              baseRefName: 'main',
              baseRefOid: 'base-sha',
              headRefName: 'feature',
              headRefOid: 'head-sha',
            }),
          },
        },
      };

      const mockGraphQLResponse2: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: Array(50).fill({
              number: 2,
              title: 'Test PR 2',
              state: 'CLOSED',
              author: { login: 'user2' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              closedAt: now.toISOString(),
              mergedAt: now.toISOString(),
              commits: { totalCount: 2 },
              additions: 20,
              deletions: 15,
              changedFiles: 3,
              baseRefName: 'main',
              baseRefOid: 'base-sha-2',
              headRefName: 'feature-2',
              headRefOid: 'head-sha-2',
            }),
          },
        },
      };

      mockClient.graphql
        .mockResolvedValueOnce(mockGraphQLResponse1)
        .mockResolvedValueOnce(mockGraphQLResponse2);

      const result = await repository.fetchPullRequests(7);

      expect(result).toHaveLength(150);
      expect(mockClient.graphql).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback if provided', async () => {
      const now = new Date();
      const mockGraphQLResponse: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: Array(50).fill({
              number: 1,
              title: 'Test PR',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              closedAt: null,
              mergedAt: null,
              commits: { totalCount: 1 },
              additions: 10,
              deletions: 5,
              changedFiles: 2,
              baseRefName: 'main',
              baseRefOid: 'base-sha',
              headRefName: 'feature',
              headRefOid: 'head-sha',
            }),
          },
        },
      };

      mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

      const mockProgressCallback: ProgressCallback = jest.fn();

      await repository.fetchPullRequests(7, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledWith(
        50,
        Infinity,
        'Fetched 50 pull requests',
      );
    });

    it('should handle errors during API requests', async () => {
      const error = new Error('API Error');
      mockClient.graphql.mockRejectedValue(error);

      await expect(repository.fetchPullRequests(7)).rejects.toThrow(
        'Failed to fetch pull requests: API Error',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching pull requests:',
        error,
      );
    });

    it('should use cache when available', async () => {
      const cachedPRs = [
        { id: 1, created_at: new Date().toISOString() },
      ] as IPullRequest[];

      // Simulate cache hit
      (
        mockCacheService.get as jest.Mock<Promise<IPullRequest[]>>
      ).mockResolvedValueOnce(cachedPRs);

      const result = await repository.fetchPullRequests(7);

      expect(result).toEqual(cachedPRs);
      expect(mockClient.graphql).not.toHaveBeenCalled();
    });
  });
});
```
