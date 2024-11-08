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
import mongoose from 'mongoose';

import { container as appContainer } from './appContainer.js';
import { ApiResponse } from './cross-cutting/ApiResponse/ApiResponse.js';
import { CacheService } from './cross-cutting/CacheService/CacheService.js';
import { Config } from './cross-cutting/Config/config.js';
import { Logger } from './cross-cutting/Logger/index.js';
import { GitHubAdapter } from './data/adapters/GitHubAdapter/GitHubAdapter.js';
import { GoogleSheetsAdapter } from './data/adapters/GoogleSheetAdapter/GoogleSheetAdapter.js';
import { MongoAdapter } from './data/adapters/MongoAdapter/MongoAdapter.js';
import { GitHubMetricModel } from './data/models/GitHubMetric.js';
import { GitHubPullRequest } from './data/models/GitHubPullRequest.js';
import { GoogleSheetsMetric } from './data/models/GoogleSheetsMetric.js';
import { User } from './data/models/User.js';
import { GitHubRepository } from './data/repositories/GitHubRepository/GitHubRepository.js';
import { GoogleSheetsRepository } from './data/repositories/GoogleSheetsRepository/GoogleSheetsRepository.js';
import { UserRepository } from './data/repositories/UserRepository/UserRepository.js';
import { AuthController } from './presentation/controllers/AuthController/AuthController.js';
import { HealthCheckController } from './presentation/controllers/HealthCheckController/HealthCheckController.js';
import { MetricsController } from './presentation/controllers/MetricsController/MetricsController.js';
import { AuthMiddleware } from './presentation/middleware/AuthMiddleware/AuthMiddleware.js';
import { CorsMiddleware } from './presentation/middleware/CorsMiddleware/CorsMiddleware.js';
import { ErrorHandler } from './presentation/middleware/ErrorHandler/ErrorHandler.js';
import { RateLimitMiddleware } from './presentation/middleware/RateLimitMiddleware/RateLimitMiddleware.js';
import { SecurityHeadersMiddleware } from './presentation/middleware/SecurityHeadersMiddleware/SecurityHeadersMiddleware.js';
import { AuthenticationService } from './services/AuthenticationService/AuthenticationService.js';
import { BcryptService } from './services/BcryptService/index.js';
import { GitHubService } from './services/GitHubService/GitHubService.js';
import { GoogleSheetsService } from './services/GoogleSheetsService/GoogleSheetsService.js';
import { JobQueueService } from './services/JobQueueService/JobQueueService.js';
import { JwtService } from './services/JwtService/index.js';
import { MetricCalculator } from './services/MetricsCalculator/MetricsCalculator.js';
import { MetricsService } from './services/MetricsService/MetricsService.js';
import { MongoDbClient } from './services/MongoDbClient/MongoDbClient.js';
import { ProcessingService } from './services/ProcessingService/ProcessingService.js';
import { ProgressTracker } from './services/ProgressTracker/ProgressTracker.js';
import TokenBlacklistService from './services/TokenBlacklistService/index.js';
import { TokenService } from './services/TokenService/index.js';
import { UserService } from './services/UserService/UserService.js';
import { TeamHealthDashboardApp } from './TeamHealthDashboardApp.js';

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
  ICorsMiddleware,
  IErrorHandler,
  IGitHubClient,
  IGitHubMetricDocument,
  IGitHubPullRequest,
  IGitHubRepository,
  IGitHubService,
  IGoogleSheetsClient,
  IGoogleSheetsMetric,
  IGoogleSheetsRepository,
  IGoogleSheetsService,
  IHealthCheckController,
  IJobQueueService,
  IJwtService,
  ILogger,
  IMetricCalculator,
  IMetricsController,
  IMetricsService,
  IMongoAdapter,
  IMongoDbClient,
  IProcessingService,
  IProgressTracker,
  ITeamHealthDashboardApp,
  ITokenBlacklistService,
  ITokenService,
  IUser,
  IUserRepository,
  IUserService,
  IRateLimitMiddleware,
  ISecurityHeadersMiddleware,
  IRateLimitConfig,
  ISecurityHeadersConfig,
  ISecurityLogger,
} from './interfaces/index.js';
import {
  rateLimitConfig,
  securityHeadersConfig,
} from './cross-cutting/Config/middlewareConfig.js';
import { SecurityLogger } from './services/SecurityLogger/SecurityLogger.js';

const config = Config.getInstance();

export function setupContainer(
  overrides?: Partial<Record<symbol, any>>,
  isTestMode = false,
): Container {
  const container = appContainer.createChild();

  /**
   *  !1. Configuration and Logging (Fundamental Dependencies)
   */
  container.bind<IConfig>(TYPES.Config).toConstantValue(config);
  container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
  container
    .bind<ISecurityLogger>(TYPES.SecurityLogger)
    .to(SecurityLogger)
    .inSingletonScope();
  container.bind<string>(TYPES.LogLevel).toConstantValue(config.LOG_LEVEL);
  container.bind<string>(TYPES.LogFormat).toConstantValue(config.LOG_FORMAT);
  container.bind<IApiResponse>(TYPES.ApiResponse).to(ApiResponse);
  container.bind<ITokenService>(TYPES.TokenService).to(TokenService);
  container
    .bind<ITokenBlacklistService>(TYPES.TokenBlacklistService)
    .to(TokenBlacklistService);

  /**
   * !2. Core Services and Utilities
   */
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
  container
    .bind<IProcessingService>(TYPES.ProcessingService)
    .to(ProcessingService);
  container.bind<IJobQueueService>(TYPES.JobQueueService).to(JobQueueService);
  container
    .bind<IAuthenticationService>(TYPES.AuthenticationService)
    .to(AuthenticationService);
  /**
   * !3. Adapters (Clients for external services)
   */
  container.bind<IMongoAdapter>(TYPES.MongoAdapter).to(MongoAdapter);
  container.bind<IGitHubClient>(TYPES.GitHubClient).to(GitHubAdapter);
  container
    .bind<IGoogleSheetsClient>(TYPES.GoogleSheetsClient)
    .to(GoogleSheetsAdapter);

  /**
   * !4. Repositories (Depend on config, logger, and potentially cache)
   **/
  container
    .bind<mongoose.Model<IGitHubPullRequest>>(TYPES.GitHubPullRequestModel)
    .toConstantValue(GitHubPullRequest);
  container.bind<mongoose.Model<IUser>>(TYPES.UserModel).toConstantValue(User);
  container
    .bind<mongoose.Model<IGitHubMetricDocument>>(TYPES.GitHubMetricModel)
    .toConstantValue(GitHubMetricModel);
  container
    .bind<mongoose.Model<IGoogleSheetsMetric>>(TYPES.GoogleSheetsMetricModel)
    .toConstantValue(GoogleSheetsMetric);
  container
    .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
    .to(GoogleSheetsRepository);
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
  container
    .bind<IGitHubRepository>(TYPES.GitHubRepository)
    .to(GitHubRepository);

  /**
   * !5. Metric Calculation (Can depend on repositories and other services)
   */
  container
    .bind<IMetricCalculator>(TYPES.MetricCalculator)
    .to(MetricCalculator);

  /**
   * !6.  Services (Depend on repositories, metric calculators, and other services)
   */
  container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
  container.bind<IUserService>(TYPES.UserService).to(UserService);
  container
    .bind<IGoogleSheetsService>(TYPES.GoogleSheetsService)
    .to(GoogleSheetsService);
  container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService);

  /**
   * !7.  Controllers (Depend on services)
   */
  container
    .bind<IHealthCheckController>(TYPES.HealthCheckController)
    .to(HealthCheckController);
  container.bind<IAuthController>(TYPES.AuthController).to(AuthController);
  container
    .bind<IMetricsController>(TYPES.MetricsController)
    .to(MetricsController);

  /**
   * !8.  Middleware Configuration Bindings
   */
  container
    .bind<IRateLimitConfig>(TYPES.RateLimitConfig)
    .toConstantValue(rateLimitConfig);
  container
    .bind<ISecurityHeadersConfig>(TYPES.SecurityHeadersConfig)
    .toConstantValue(securityHeadersConfig);
  /**
   * !9. Middleware Bindings
   */
  container
    .bind<ICorsMiddleware>(TYPES.CorsMiddleware)
    .to(CorsMiddleware)
    .inSingletonScope();
  container
    .bind<IErrorHandler>(TYPES.ErrorHandler)
    .to(ErrorHandler)
    .inSingletonScope();
  container
    .bind<IAuthMiddleware>(TYPES.AuthMiddleware)
    .to(AuthMiddleware)
    .inSingletonScope();
  container
    .bind<IRateLimitMiddleware>(TYPES.RateLimitMiddleware)
    .to(RateLimitMiddleware)
    .inSingletonScope();
  container
    .bind<ISecurityHeadersMiddleware>(TYPES.SecurityHeadersMiddleware)
    .to(SecurityHeadersMiddleware)
    .inSingletonScope();

  /**
   * !10. Application (Depends on middleware, routers, and potentially other services)
   */
  container
    .bind<IApplication>(TYPES.Application)
    .to(TeamHealthDashboardApp)
    .inSingletonScope();

  for (const key in TYPES) {
    if (Object.prototype.hasOwnProperty.call(TYPES, key)) {
      const typeKey = TYPES[key as keyof typeof TYPES];
      console.log(
        `${key}: ${container.isBound(typeKey) ? 'Bound' : 'Not bound'}`,
      );
    }
  }

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
