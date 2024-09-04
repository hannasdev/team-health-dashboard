/**
 * Dependency Injection Container
 *
 * This file sets up the InversifyJS container for dependency injection
 * across the Team Health Dashboard application. It binds interfaces to their
 * implementations for services, controllers, and utilities.
 *
 * @module Container
 */

import { Container } from 'inversify';

import { GitHubAdapter } from './adapters/GitHubAdapter.js';
import { GoogleSheetsAdapter } from './adapters/GoogleSheetAdapter.js';
import { MongoAdapter } from './adapters/MongoAdapter.js';
import { NodeEventEmitterAdapter } from './adapters/NodeEventEmitterAdapter.js';
import { container as appContainer } from './appContainer.js';
import { Config } from './config/config.js';
import { AuthController } from './controllers/AuthController/AuthController.js';
import { HealthCheckController } from './controllers/HealthCheckController/HealthCheckController.js';
import { MetricsController } from './controllers/MetricsController/MetricsController.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';
import { ErrorHandler } from './middleware/ErrorHandler.js';
import { GitHubRepository } from './repositories/github/GitHubRepository.js';
import { GoogleSheetsRepository } from './repositories/googlesheets/GoogleSheetsRepository.js';
import { UserRepository } from './repositories/user/UserRepository.js';
import { AuthenticationService } from './services/auth/AuthenticationService.js';
import { CacheService } from './services/cache/CacheService.js';
import { MongoDbClient } from './services/database/MongoDbClient.js';
import { MetricCalculator } from './services/metrics/MetricsCalculator.js';
import { MetricsService } from './services/metrics/MetricsService.js';
import { ProgressTracker } from './services/progress/ProgressTracker.js';
import TokenBlacklistService from './services/TokenBlacklistService/index.js';
import { TokenService } from './services/TokenService/index.js';
import { UserService } from './services/user/UserService.js';
import { TeamHealthDashboardApp } from './TeamHealthDashboardApp.js';
import { ApiResponse } from './utils/ApiResponse/ApiResponse.js';
import { BcryptService } from './utils/BcryptService/index.js';
import { JwtService } from './utils/JwtService/index.js';
import { Logger } from './utils/Logger/index.js';
import { SSEService } from './utils/SSEService/SSEService.js';
import { TYPES } from './utils/types.js';

import type {
  IApiResponse,
  IApplication,
  IAuthController,
  IAuthMiddleware,
  IAuthenticationService,
  IBcryptService,
  ICacheService,
  IConfig,
  IErrorHandler,
  IGitHubClient,
  IGitHubRepository,
  IGoogleSheetsClient,
  IGoogleSheetsRepository,
  IHealthCheckController,
  IJwtService,
  ILogger,
  IMetricCalculator,
  IMetricsController,
  IMetricsService,
  IMongoAdapter,
  IMongoDbClient,
  IProgressTracker,
  ISSEService,
  ITeamHealthDashboardApp,
  ITokenBlacklistService,
  ITokenService,
  IUserRepository,
  IUserService,
  IEventEmitter,
} from './interfaces/index.js';

const config = Config.getInstance();

export function setupContainer(
  overrides?: Partial<Record<symbol, any>>,
  isTestMode = false,
): Container {
  const container = appContainer.createChild();

  // 1. Configuration and Logging (Fundamental Dependencies)
  container.bind<IConfig>(TYPES.Config).toConstantValue(config);
  container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
  container.bind<string>(TYPES.LogLevel).toConstantValue(config.LOG_LEVEL);
  container.bind<string>(TYPES.LogFormat).toConstantValue(config.LOG_FORMAT);
  container.bind<IApiResponse>(TYPES.ApiResponse).to(ApiResponse);
  container.bind<ITokenService>(TYPES.TokenService).to(TokenService);
  container
    .bind<ITokenBlacklistService>(TYPES.TokenBlacklistService)
    .to(TokenBlacklistService);

  // 2. Core Services and Utilities
  container
    .bind<ITeamHealthDashboardApp>(TYPES.TeamHealthDashboardApp)
    .to(TeamHealthDashboardApp);
  container.bind<ICacheService>(TYPES.CacheService).to(CacheService); // Often used by other services
  container.bind<IProgressTracker>(TYPES.ProgressTracker).to(ProgressTracker);
  container.bind<IBcryptService>(TYPES.BcryptService).to(BcryptService);
  container.bind<IJwtService>(TYPES.JwtService).to(JwtService);
  container
    .bind<IMongoDbClient>(TYPES.MongoDbClient)
    .to(MongoDbClient)
    .inSingletonScope();

  // 3. Adapters (Clients for external services)
  container
    .bind<IEventEmitter>(TYPES.EventEmitter)
    .to(NodeEventEmitterAdapter)
    .inSingletonScope();
  container.bind<IMongoAdapter>(TYPES.MongoAdapter).to(MongoAdapter);
  container.bind<IGitHubClient>(TYPES.GitHubClient).to(GitHubAdapter);
  container
    .bind<IGoogleSheetsClient>(TYPES.GoogleSheetsClient)
    .to(GoogleSheetsAdapter);

  // 3. Repositories (Depend on config, logger, and potentially cache)
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
  container
    .bind<IGitHubRepository>(TYPES.GitHubRepository)
    .to(GitHubRepository);
  container
    .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
    .to(GoogleSheetsRepository);

  // 4. Metric Calculation (Can depend on repositories and other services)
  container
    .bind<IMetricCalculator>(TYPES.MetricCalculator)
    .to(MetricCalculator);

  // 6.  Services (Depend on repositories, metric calculators, and other services)
  container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
  container.bind<IUserService>(TYPES.UserService).to(UserService);

  // 7.  Controllers (Depend on services)
  container
    .bind<IHealthCheckController>(TYPES.HealthCheckController)
    .to(HealthCheckController);
  container.bind<IAuthController>(TYPES.AuthController).to(AuthController);
  container
    .bind<IMetricsController>(TYPES.MetricsController)
    .to(MetricsController);

  // 8.  Middleware (Can depend on services)
  container.bind<IErrorHandler>(TYPES.ErrorHandler).to(ErrorHandler);
  container
    .bind<IAuthenticationService>(TYPES.AuthenticationService)
    .to(AuthenticationService);
  container.bind<IAuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

  // 9. Application (Depends on middleware, routers, and potentially other services)
  container
    .bind<IApplication>(TYPES.Application)
    .to(TeamHealthDashboardApp)
    .inSingletonScope();
  container
    .bind<ISSEService>(TYPES.SSEService)
    .to(SSEService)
    .inSingletonScope();

  if (isTestMode) {
    // Add any test-specific bindings or overrides here
    // For example, you might want to use in-memory implementations of certain services
  }

  // Override bindings if provided
  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      const symbolKey = Symbol.for(key);
      if (container.isBound(symbolKey)) {
        container.rebind(symbolKey).toConstantValue(value);
      } else {
        container.bind(symbolKey).toConstantValue(value);
      }
    });
  }

  return container;
}

// Create and export the default container
const container = setupContainer();

export { container };
