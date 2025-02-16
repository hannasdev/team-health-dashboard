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
import mongoose, { Model } from 'mongoose';

import { container as appContainer } from './appContainer.js';
import { ApiResponse } from './cross-cutting/ApiResponse/ApiResponse.js';
import { CacheService } from './cross-cutting/CacheService/CacheService.js';
import { Config } from './cross-cutting/Config/config.js';
import {
  rateLimitConfig,
  securityHeadersConfig,
} from './cross-cutting/Config/middlewareConfig.js';
import { Logger } from './cross-cutting/Logger/index.js';
import { SecurityLogger } from './cross-cutting/SecurityLogger/SecurityLogger.js';
import { GitHubAdapter } from './data/adapters/GitHubAdapter/index.js';
import { GoogleSheetsAdapter } from './data/adapters/GoogleSheetsAdapter/index.js';
import { MongoAdapter } from './data/adapters/MongoAdapter/MongoAdapter.js';
import { GitHubMetricModel } from './data/models/githubMetricModel/index.js';
import { GitHubPullRequestModel } from './data/models/githubPullRequestModel/index.js';
import { GoogleSheetsMetricModel } from './data/models/googleSheetsMetricModel/index.js';
import { RepositoryModel } from './data/models/repositoryModel/index.js';
import { UserModel } from './data/models/userModel/index.js';
import { GitHubRepository } from './data/repositories/GitHubRepository/index.js';
import { GoogleSheetsRepository } from './data/repositories/GoogleSheetsRepository/index.js';
import { RepositoryRepository } from './data/repositories/RepositoryRepository/index.js';
import { UserRepository } from './data/repositories/UserRepository/index.js';
import { AuthController } from './presentation/controllers/AuthController/index.js';
import { HealthCheckController } from './presentation/controllers/HealthCheckController/index.js';
import { MetricsController } from './presentation/controllers/MetricsController/index.js';
import { RepositoryController } from './presentation/controllers/RepositoryController/index.js';
import { AuthMiddleware } from './presentation/middleware/AuthMiddleware/index.js';
import { CorsMiddleware } from './presentation/middleware/CorsMiddleware/index.js';
import { ErrorHandler } from './presentation/middleware/ErrorHandler/index.js';
import { RateLimitMiddleware } from './presentation/middleware/RateLimitMiddleware/index.js';
import { SecurityHeadersMiddleware } from './presentation/middleware/SecurityHeadersMiddleware/index.js';
import { AuthenticationService } from './services/AuthenticationService/index.js';
import { BcryptService } from './services/BcryptService/index.js';
import { GitHubService } from './services/GitHubService/index.js';
import { GoogleSheetsService } from './services/GoogleSheetsService/index.js';
import { JobQueueService } from './services/JobQueueService/index.js';
import { JwtService } from './services/JwtService/index.js';
import { MetricsCalculator } from './services/MetricsCalculator/index.js';
import { MetricsService } from './services/MetricsService/index.js';
import { MongoClientService } from './services/MongoClientService/index.js';
import { ProcessingService } from './services/ProcessingService/index.js';
import { ProgressTracker } from './services/ProgressTracker/index.js';
import { RepositoryManagementService } from './services/RepositoryManagementService/index.js';
import { TokenBlacklistService } from './services/TokenBlacklistService/index.js';
import { TokenService } from './services/TokenService/index.js';
import { UserService } from './services/UserService/index.js';
import { TeamHealthDashboardApp } from './TeamHealthDashboardApp.js';
import { TYPES } from './utils/types.js';

import type { IApiResponse } from './cross-cutting/ApiResponse/index.js';
import type { ICacheService } from './cross-cutting/CacheService/index.js';
import type { IConfig } from './cross-cutting/Config/index.js';
import type { ILogger } from './cross-cutting/Logger/index.js';
import type { ISecurityLogger } from './cross-cutting/SecurityLogger/index.js';
import type { IGitHubAdapter } from './data/adapters/GitHubAdapter/index.js';
import type { IGoogleSheetsAdapter } from './data/adapters/GoogleSheetsAdapter/index.js';
import type { IMongoAdapter } from './data/adapters/MongoAdapter/index.js';
import type { IGitHubMetricDocument } from './data/models/githubMetricModel/index.js';
import type { IGitHubPullRequestDocument } from './data/models/githubPullRequestModel/index.js';
import type { IGoogleSheetsMetricDocument } from './data/models/googleSheetsMetricModel/index.js';
import type { IRepositoryDocument } from './data/models/repositoryModel/index.js';
import type { IUserModel } from './data/models/userModel/index.js';
import type { IGitHubRepository } from './data/repositories/GitHubRepository/index.js';
import type { IGoogleSheetsRepository } from './data/repositories/GoogleSheetsRepository/index.js';
import type {
  IRepositoryRepository,
  IRepository,
} from './data/repositories/RepositoryRepository/index.js';
import type { IUserRepository } from './data/repositories/UserRepository/index.js';
import type { IApplication } from './IApplication.js';
import type { IAuthController } from './presentation/controllers/AuthController/index.js';
import type { IHealthCheckController } from './presentation/controllers/HealthCheckController/index.js';
import type { IMetricsController } from './presentation/controllers/MetricsController/index.js';
import type { IRepositoryController } from './presentation/controllers/RepositoryController/index.js';
import type { ICorsMiddleware } from './presentation/middleware/CorsMiddleware/index.js';
import type { IErrorHandler } from './presentation/middleware/ErrorHandler/index.js';
import type { IMiddleware } from './presentation/middleware/interfaces/index.js';
import type {
  IRateLimitConfig,
  IRateLimitMiddleware,
} from './presentation/middleware/RateLimitMiddleware/index.js';
import type {
  ISecurityHeadersConfig,
  ISecurityHeadersMiddleware,
} from './presentation/middleware/SecurityHeadersMiddleware/index.js';
import type { IAuthenticationService } from './services/AuthenticationService/index.js';
import type { IBcryptService } from './services/BcryptService/index.js';
import type { IGitHubService } from './services/GitHubService/index.js';
import type { IGoogleSheetsService } from './services/GoogleSheetsService/index.js';
import type { IJobQueueService } from './services/JobQueueService/index.js';
import type { IJwtService } from './services/JwtService/index.js';
import type { IMetricsCalculator } from './services/MetricsCalculator/index.js';
import type { IMetricsService } from './services/MetricsService/index.js';
import type { IMongoClientService } from './services/MongoClientService/index.js';
import type { IProcessingService } from './services/ProcessingService/index.js';
import type { IProgressTracker } from './services/ProgressTracker/index.js';
import type { IRepositoryManagementService } from './services/RepositoryManagementService/index.js';
import type { ITokenBlacklistService } from './services/TokenBlacklistService/index.js';
import type { ITokenService } from './services/TokenService/index.js';
import type { IUserService } from './services/UserService/index.js';
import type { ITeamHealthDashboardApp } from 'ITeamHealthDashboardApp.js';

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
    .bind<IMongoClientService>(TYPES.MongoClientService)
    .to(MongoClientService)
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
  container
    .bind<Model<IRepositoryDocument>>(TYPES.RepositoryModel)
    .toConstantValue(RepositoryModel);
  container
    .bind<IMongoAdapter<IRepository>>(TYPES.MongoAdapter)
    .to(MongoAdapter)
    .inSingletonScope()
    .onActivation((context, adapter) => {
      adapter.setModel(context.container.get(TYPES.RepositoryModel));
      return adapter;
    });
  container.bind<IGitHubAdapter>(TYPES.GitHubAdapter).to(GitHubAdapter);
  container
    .bind<IGoogleSheetsAdapter>(TYPES.GoogleSheetsAdapter)
    .to(GoogleSheetsAdapter);

  /**
   * !4. Repositories (Depend on config, logger, and potentially cache)
   **/
  container
    .bind<
      mongoose.Model<IGitHubPullRequestDocument>
    >(TYPES.GitHubPullRequestModel)
    .toConstantValue(GitHubPullRequestModel);
  container
    .bind<mongoose.Model<IUserModel>>(TYPES.UserModel)
    .toConstantValue(UserModel);
  container
    .bind<mongoose.Model<IGitHubMetricDocument>>(TYPES.GitHubMetricModel)
    .toConstantValue(GitHubMetricModel);
  container
    .bind<
      mongoose.Model<IGoogleSheetsMetricDocument>
    >(TYPES.GoogleSheetsMetricModel)
    .toConstantValue(GoogleSheetsMetricModel);
  container
    .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
    .to(GoogleSheetsRepository);
  container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
  container
    .bind<IGitHubRepository>(TYPES.GitHubRepository)
    .to(GitHubRepository);
  container
    .bind<IRepositoryRepository>(TYPES.RepositoryRepository)
    .to(RepositoryRepository)
    .inSingletonScope();

  /**
   * !5. Metric Calculation (Can depend on repositories and other services)
   */
  container
    .bind<IMetricsCalculator>(TYPES.MetricCalculator)
    .to(MetricsCalculator);

  /**
   * !6.  Services (Depend on repositories, metric calculators, and other services)
   */
  container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
  container.bind<IUserService>(TYPES.UserService).to(UserService);
  container
    .bind<IGoogleSheetsService>(TYPES.GoogleSheetsService)
    .to(GoogleSheetsService);
  container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService);
  container
    .bind<IRepositoryManagementService>(TYPES.RepositoryManagementService)
    .to(RepositoryManagementService);
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
  container
    .bind<IRepositoryController>(TYPES.RepositoryController)
    .to(RepositoryController);

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
    .bind<IMiddleware>(TYPES.AuthMiddleware)
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
