/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  AuthController: Symbol.for('IAuthController'),
  AuthMiddleware: Symbol.for('IAuthMiddleware'),
  CacheService: Symbol.for('ICacheService'),
  Config: Symbol.for('IConfig'),
  ErrorHandler: Symbol.for('IErrorHandler'),
  GitHubClient: Symbol.for('IGitHubClient'),
  GitHubRepository: Symbol.for('IGitHubRepository'),
  GitHubService: Symbol.for('IGitHubService'),
  GoogleSheetsClient: Symbol.for('IGoogleSheetsClient'),
  GoogleSheetsRepository: Symbol.for('IGoogleSheetsRepository'),
  HealthCheckController: Symbol.for('IHealthCheckController'),
  LogFormat: Symbol.for('LogFormat'),
  LogLevel: Symbol.for('LogLevel'),
  Logger: Symbol.for('ILogger'),
  MetricCalculator: Symbol.for('IMetricCalculator'),
  MetricsController: Symbol.for('IMetricsController'),
  MetricsService: Symbol.for('IMetricsService'),
  ProgressTracker: Symbol.for('IProgressTracker'),
  UserRepository: Symbol.for('IUserRepository'),
};
