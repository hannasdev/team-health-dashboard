# Goal File Structure

```txt
root/
│
├── .env                  # Environment variables
├── .eslintrc.js          # ESLint configuration
├── .gitignore            # Git ignore file
├── .prettierrc           # Prettier configuration
├── jest.config.js        # Jest configuration
├── jest.setup.ts         # Jest setup file
├── jsconfig.json         # JavaScript configuration
├── nodemon.json          # Nodemon configuration
├── package.json          # NPM package file
├── package-lock.json     # NPM package lock file
├── README.md             # Project documentation
├── tsconfig.json         # TypeScript configuration
├── webpack.config.cjs    # Webpack configuration
│
├── src/
│   ├── app.ts            # Main application setup
│   ├── container.ts      # Dependency injection container
│   ├── index.ts          # Application entry point
│   ├── loadEnv.ts        # Environment loading logic
│   │
│   ├── interfaces/
│   │   ├── ICacheService.ts
│   │   ├── IConfig.ts
│   │   ├── IDataSource.ts
│   │   ├── IFetchDataResult.ts
│   │   ├── IGitHubClient.ts
│   │   ├── IGoogleSheetsClient.ts
│   │   ├── IMetric.ts
│   │   ├── IMetricCalculator.ts
│   │   ├── IMetricsService.ts
│   │   ├── IProgressTracker.ts
│   │   ├── IPullRequest.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── base/
│   │   │   └── BaseDataSource.ts
│   │   │
│   │   ├── cache/
│   │   │   └── CacheService.ts
│   │   │
│   │   ├── github/
│   │   │   ├── GitHubDataSource.ts
│   │   │   └── GitHubMetricCalculator.ts
│   │   │
│   │   ├── googlesheets/
│   │   │   ├── GoogleSheetsDataSource.ts
│   │   │   └── GoogleSheetsMetricCalculator.ts
│   │   │
│   │   ├── metrics/
│   │   │   └── MetricsService.ts
│   │   │
│   │   └── progress/
│   │       └── ProgressTracker.ts
│   │
│   ├── adapters/
│   │   ├── GitHubAdapter.ts
│   │   └── GoogleSheetsAdapter.ts
│   │
│   ├── controllers/
│   │   └── MetricsController.ts
│   │
│   ├── utils/
│   │   ├── CacheDecorator.ts
│   │   ├── Logger.ts
│   │   └── types.ts
│   │
│   └── types.ts          # TypeScript type definitions
│
├── __mocks__/            # Mock objects for testing
├── __tests__/            # Test files
│   ├── e2e/              # End-to-end tests
│   └── integration/      # Integration tests
│
├── docs/                 # Documentation files
├── public/               # Static assets
├── scripts/              # Utility scripts
├── node_modules/         # Third-party dependencies (git-ignored)
└── dist/                 # Compiled output (git-ignored)
```
