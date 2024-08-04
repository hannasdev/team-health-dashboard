# Project File Structure

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
├── src/                  # Source code
│   ├── app.ts            # Main application setup
│   ├── container.ts      # Dependency injection container
│   ├── index.ts          # Application entry point
│   ├── loadEnv.ts        # Environment loading logic
│   │
│   ├── __mocks__/        # Mock objects for testing
│   ├── __tests__/        # Test files
│   │   ├── e2e/          # End-to-end tests
│   │   └── integration/  # Integration tests
│   │
│   ├── adapters/         # Adapter implementations
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── interfaces/       # TypeScript interfaces
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── repositories/     # Data access layer
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
│
├── docs/                 # Documentation files
├── public/               # Static assets
├── scripts/              # Utility scripts
├── node_modules/         # Third-party dependencies (git-ignored)
└── dist/                 # Compiled output (git-ignored)
```
