/**
 * src/container.ts
 *
 * This file manages dependencies across the application, including
 * controllers, services, and utilities.
 */
import { Container } from 'inversify';
import { TYPES } from './utils/types';
import type { IGoogleSheetsService } from './interfaces/IGoogleSheetsService';
import type { IGitHubService } from './interfaces/IGitHubService';
import type { IMetricsService } from './interfaces/IMetricsService';
import type { IErrorHandler } from './interfaces/IErrorHandler';
import type { IGitHubClient } from './interfaces/IGitHubClient';
import type { IGoogleSheetsClient } from './interfaces/IGoogleSheetsClient';
import { Logger } from './utils/logger';
import {
  GoogleSheetsService,
  GoogleSheetsAdapter,
} from './services/GoogleSheetsService';
import { GitHubService, OctokitAdapter } from './services/GitHubService';
import { MetricsService } from './services/MetricsService';
import { ErrorHandler } from './middleware/ErrorHandler';
import { IConfig } from './interfaces/IConfig';
import { config } from './config/config';
import { MetricsController } from './controllers/MetricsController';

const container = new Container();

// Config
container.bind<IConfig>(TYPES.Config).toConstantValue(config);

// Logger
container.bind<Logger>(TYPES.Logger).to(Logger);

// ErrorHandler
container.bind<IErrorHandler>(TYPES.ErrorHandler).to(ErrorHandler);

// GoogleSheets
container
  .bind<IGoogleSheetsClient>(TYPES.GoogleSheetsClient)
  .to(GoogleSheetsAdapter);
container
  .bind<IGoogleSheetsService>(TYPES.GoogleSheetsService)
  .to(GoogleSheetsService);

// GitHub
container.bind<IGitHubClient>(TYPES.GitHubClient).to(OctokitAdapter);
container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService);

// Metrics
container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);

// Controllers
container
  .bind<MetricsController>(TYPES.MetricsController)
  .to(MetricsController);

export { container };
