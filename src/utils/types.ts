/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  AuthController: Symbol.for('AuthController'),
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  CacheService: Symbol.for('CacheService'),
  Config: Symbol.for('Config'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  GitHubClient: Symbol.for('GitHubClient'),
  GitHubDataSource: Symbol.for('GitHubDataSource'),
  GitHubMetricCalculator: Symbol.for('GitHubMetricCalculator'),
  GitHubRepository: Symbol.for('GitHubRepository'),
  GitHubService: Symbol.for('GitHubService'),
  GoogleSheetsClient: Symbol.for('GoogleSheetsClient'),
  GoogleSheetsDataSource: Symbol.for('GoogleSheetsDataSource'),
  GoogleSheetsMetricCalculator: Symbol.for('GoogleSheetsMetricCalculator'),
  GoogleSheetsService: Symbol.for('GoogleSheetsService'),
  LogFormat: Symbol.for('LogFormat'),
  LogLevel: Symbol.for('LogLevel'),
  Logger: Symbol.for('Logger'),
  MetricCalculator: Symbol.for('MetricCalculator'),
  MetricsController: Symbol.for('MetricsController'),
  MetricsService: Symbol.for('MetricsService'),
  ProgressTracker: Symbol.for('ProgressTracker'),
  UserRepository: Symbol.for('UserRepository'),
};
