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
import { TYPES } from './utils/types';
import { Logger } from './utils/logger';
import { ErrorHandler } from './middleware/ErrorHandler';
import { config } from './config/config';
import { CacheService } from './services/CacheService';
import { GoogleSheetsService } from './services/GoogleSheetsService';
import { GoogleSheetsAdapter } from './adapters/GoogleSheetAdapter';
import { GitHubService } from './services/GitHubService';
import { GitHubAdapter } from './adapters/GitHubAdapter';
import { MetricsService } from './services/MetricsService';
import { MetricsController } from './controllers/MetricsController';
import type {
  IConfig,
  IErrorHandler,
  ICacheService,
  IGoogleSheetsService,
  IGoogleSheetsClient,
  IGitHubService,
  IGitHubClient,
  IMetricsService,
} from './interfaces/index';

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

// Metrics
container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
container
  .bind<MetricsController>(TYPES.MetricsController)
  .to(MetricsController);

export { container };
