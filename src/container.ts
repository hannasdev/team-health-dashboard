/**
 * Dependency Injection Container
 *
 * This file sets up the InversifyJS container for dependency injection
 * across the Team Health Dashboard application. It binds interfaces to their
 * implementations for services, controllers, and utilities.
 *
 * @module Container
 */

import bcrypt from 'bcrypt';
import { Container } from 'inversify';
import jwt from 'jsonwebtoken';

import { GitHubAdapter } from '@/adapters/GitHubAdapter';
import { GoogleSheetsAdapter } from '@/adapters/GoogleSheetAdapter';
import { Config } from '@/config/config';
import {
  AuthController,
  IBcryptService,
  IJwtService,
} from '@/controllers/AuthController';
import { HealthCheckController } from '@/controllers/HealthCheckController';
import { MetricsController } from '@/controllers/MetricsController';
import {
  ILogger,
  ICacheService,
  IConfig,
  IErrorHandler,
  IGitHubClient,
  IGitHubRepository,
  IGoogleSheetsClient,
  IGoogleSheetsRepository,
  IMetricCalculator,
  IMetricsService,
  IProgressTracker,
  IAuthController,
  IHealthCheckController,
  IMetricsController,
  IUserRepository,
  IAuthMiddleware,
} from '@/interfaces';
import { AuthMiddleware } from '@/middleware/AuthMiddleware';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { GitHubRepository } from '@/repositories/github/GitHubRepository';
import { GoogleSheetsRepository } from '@/repositories/googlesheets/GoogleSheetsRepository';
import { UserRepository } from '@/repositories/user/UserRepository';
import { CacheService } from '@/services/cache/CacheService';
import { MetricCalculator } from '@/services/metrics/MetricsCalculator';
import { MetricsService } from '@/services/metrics/MetricsService';
import { ProgressTracker } from '@/services/progress/ProgressTracker';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

// Implement BcryptService
class BcryptService implements IBcryptService {
  async hash(data: string, saltOrRounds: string | number): Promise<string> {
    return bcrypt.hash(data, saltOrRounds);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}

// Implement JwtService
class JwtService implements IJwtService {
  sign(payload: object, secretOrPrivateKey: string, options?: object): string {
    return jwt.sign(payload, secretOrPrivateKey, options);
  }
}

const container = new Container();
const config = Config.getInstance();

// Config
container.bind<IConfig>(TYPES.Config).toConstantValue(config);

// Health Check
container
  .bind<IHealthCheckController>(TYPES.HealthCheckController)
  .to(HealthCheckController);

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
  .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
  .to(GoogleSheetsRepository);

// GitHub
container.bind<IGitHubClient>(TYPES.GitHubClient).to(GitHubAdapter);
container.bind<IGitHubRepository>(TYPES.GitHubRepository).to(GitHubRepository);

// Metrics
container.bind<IMetricCalculator>(TYPES.MetricCalculator).to(MetricCalculator);
container.bind<IMetricsService>(TYPES.MetricsService).to(MetricsService);
container
  .bind<IMetricsController>(TYPES.MetricsController)
  .to(MetricsController);

// Progress Tracking
container.bind<IProgressTracker>(TYPES.ProgressTracker).to(ProgressTracker);

// User Repository
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);

// Auth Controller
container.bind<IAuthController>(TYPES.AuthController).to(AuthController);

// Auth Middleware
container.bind<IAuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

// BcryptService and JwtService
container.bind<IBcryptService>(TYPES.BcryptService).to(BcryptService);
container.bind<IJwtService>(TYPES.JwtService).to(JwtService);

export { container };
