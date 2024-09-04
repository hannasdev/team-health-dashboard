/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  ApiResponse: Symbol.for('IApiResponse'),
  Application: Symbol.for('IApplication'),
  AuthController: Symbol.for('IAuthController'),
  AuthMiddleware: Symbol.for('IAuthMiddleware'),
  AuthenticationService: Symbol.for('IAuthenticationService'),
  BcryptService: Symbol.for('IBcryptService'),
  CacheService: Symbol.for('ICacheService'),
  Config: Symbol.for('IConfig'),
  ErrorHandler: Symbol.for('IErrorHandler'),
  EventEmitter: Symbol.for('IEventEmitter'),
  GitHubClient: Symbol.for('IGitHubClient'),
  GitHubRepository: Symbol.for('IGitHubRepository'),
  GitHubService: Symbol.for('IGitHubService'),
  GoogleSheetsClient: Symbol.for('IGoogleSheetsClient'),
  GoogleSheetsRepository: Symbol.for('IGoogleSheetsRepository'),
  HealthCheckController: Symbol.for('IHealthCheckController'),
  JwtService: Symbol.for('IJwtService'),
  LogFormat: Symbol.for('LogFormat'),
  LogLevel: Symbol.for('LogLevel'),
  Logger: Symbol.for('ILogger'),
  MetricCalculator: Symbol.for('IMetricCalculator'),
  MetricsController: Symbol.for('IMetricsController'),
  MetricsService: Symbol.for('IMetricsService'),
  MongoAdapter: Symbol.for('IMongoAdapter'),
  MongoDbClient: Symbol.for('MongoDbClient'),
  ProgressTracker: Symbol.for('IProgressTracker'),
  SSEService: Symbol.for('ISSEService'),
  TeamHealthDashboardApp: Symbol.for('ITeamHealthDashboardApp'),
  TokenBlacklistService: Symbol.for('ITokenBlacklistService'),
  TokenService: Symbol.for('ITokenService'),
  UserRepository: Symbol.for('IUserRepository'),
  UserService: Symbol.for('IUserService'),
};
