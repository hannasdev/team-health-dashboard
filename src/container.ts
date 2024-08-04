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
import { AuthController } from './controllers/AuthController';
import { CacheService } from './services/cache/CacheService';
import { ErrorHandler } from './middleware/ErrorHandler';
import { GitHubAdapter } from './adapters/GitHubAdapter';
import { GitHubRepository } from './repositories/github/GitHubRepository';
import { GitHubService } from './services/github/GitHubService';
import { GoogleSheetsAdapter } from './adapters/GoogleSheetAdapter';
import { GoogleSheetsService } from './services/googlesheets/GoogleSheetsService';
import { Logger } from './utils/logger';
import { MetricCalculator } from './services/metrics/MetricsCalculator';
import { MetricsController } from './controllers/MetricsController';
import { MetricsService } from './services/metrics/MetricsService';
import { ProgressTracker } from './services/progress/ProgressTracker';
import { UserRepository } from './repositories/user/UserRepository';
import { TYPES } from './utils/types';
import { config } from './config/config';
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
container.bind<Logger>(TYPES.Logger).to(Logger);

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
