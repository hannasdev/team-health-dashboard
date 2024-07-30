/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  Config: Symbol.for('Config'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  GitHubClient: Symbol.for('GitHubClient'),
  GitHubService: Symbol.for('GitHubService'),
  GoogleSheetsClient: Symbol.for('GoogleSheetsClient'),
  GoogleSheetsService: Symbol.for('GoogleSheetsService'),
  Logger: Symbol.for('Logger'),
  MetricsService: Symbol.for('MetricsService'),
  MetricsController: Symbol.for('MetricsController'),
};
