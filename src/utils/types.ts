/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  CacheService: Symbol.for('CacheService'),
  Config: Symbol.for('Config'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  GitHubClient: Symbol.for('GitHubClient'),
  GitHubRepository: Symbol.for('GitHubRepository'),
  GitHubService: Symbol.for('GitHubService'),
  GoogleSheetsClient: Symbol.for('GoogleSheetsClient'),
  GoogleSheetsService: Symbol.for('GoogleSheetsService'),
  Logger: Symbol.for('Logger'),
  MetricCalculator: Symbol.for('MetricCalculator'),
  MetricsController: Symbol.for('MetricsController'),
  MetricsService: Symbol.for('MetricsService'),
  ProgressTracker: Symbol.for('ProgressTracker'),
};
