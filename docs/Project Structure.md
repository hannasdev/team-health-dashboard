# Project Structure

```zsh
/team-dashboard-backend
│
├── src/
│   ├── __mocks__/
│   │   └── mockFactories.ts
│   ├── config/
│   │   └── config.ts
│   ├── controllers/
│   │   ├── AuthController.test.ts
│   │   ├── AuthController.ts
│   │   ├── MetricsController.test.ts
│   │   └── MetricsController.ts
│   ├── interfaces/
│   │   ├── IAuthRequest.ts
│   │   ├── ICacheService.ts
│   │   ├── IConfig.ts
│   │   ├── IDataService.ts
│   │   ├── IErrorHandler.ts
│   │   ├── IFetchDataResult.ts
│   │   ├── IGitHubClient.ts
│   │   ├── IGitHubRepository.ts
│   │   ├── IGitHubService.ts
│   │   ├── IGoogleSheetsClient.ts
│   │   ├── IGoogleSheetsService.ts
│   │   ├── IGraphQLResponse.ts
│   │   ├── ILogger.ts
│   │   ├── IMetricCalculator.ts
│   │   ├── IMetricModel.ts
│   │   ├── IMetricService.ts
│   │   ├── IProgressTracker.ts
│   │   ├── IPullRequest.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── AuthMiddleWare.test.ts
│   │   ├── AuthMiddleWare.ts
│   │   └── ErrorHandler.ts
│   ├── models/
│   │   ├── Metric.ts
│   │   └── User.ts
│   ├── repositories/
│   │   ├── github/
│   │   │   ├── GitHubRepository.test.ts
│   │   │   └── GitHubRepository.ts
│   │   └── user/
│   │       ├── UserRepository.integration.test.ts
│   │       └── UserRepository.ts
│   ├── adapters/
│   │   ├── GitHubAdapter.ts
│   │   └── GoogleSheetAdapter.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   └── metrics.ts
│   ├── services/
│   │   ├── cache/
│   │   │   ├── CacheService.test.ts
│   │   │   └── CacheService.ts
│   │   ├── github/
│   │   │   ├── GitHubService.test.ts
│   │   │   └── GitHubService.ts
│   │   ├── googlesheets/
│   │   │   ├── GoogleSheetsService.test.ts
│   │   │   └── GoogleSheetsService.ts
│   │   ├── metrics/
│   │   │   ├── MetricsCalculator.test.ts
│   │   │   ├── MetricsCalculator.ts
│   │   │   ├── MetricsService.test.ts
│   │   │   └── MetricsService.ts
│   │   └── progress/
│   │   │   ├── ProgressTracker.test.ts
│   │   │   └── ProgressTracker.ts
│   │   └── BaseService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── CacheDecorator.test.ts
│   │   ├── CacheDecorator.ts
│   │   ├── Logger.ts
│   │   └── types.ts
│   ├── loadEnv.ts
│   ├── index.ts
│   ├── container.ts
│   └── app.ts
│
├── public/
│   └── index.html
│
├── scripts/
│   └── init-mongodb.js
│
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── jest.config.js
├── jest.setup.ts
├── jsconfig.json
├── nodemon.json
├── tsconfig.json
├── .env
├── .gitignore
├── .prettierrc
└── package.json
└── package-lock.json
```
