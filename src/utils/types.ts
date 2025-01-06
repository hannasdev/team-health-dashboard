/**
 * src/utils/types.ts
 *
 * Provides unique symbols that we use to identify our injectable dependencies.
 */
export const TYPES = {
  ApiResponse: Symbol.for('IApiResponse'),
  Application: Symbol.for('IApplication'),
  AuthController: Symbol.for('IAuthController'),
  AuthMiddleware: Symbol.for('IMiddleware'),
  AuthenticationService: Symbol.for('IAuthenticationService'),
  BcryptService: Symbol.for('IBcryptService'),
  CacheService: Symbol.for('ICacheService'),
  Config: Symbol.for('IConfig'),
  CorsMiddleware: Symbol.for('CorsMiddleware'),
  ErrorHandler: Symbol.for('IErrorHandler'),
  GitHubClient: Symbol.for('IGitHubClient'),
  GitHubMetricModel: Symbol.for('GitHubMetricModel'),
  GitHubPullRequestModel: Symbol.for('GitHubPullRequestModel'),
  GitHubRepository: Symbol.for('IGitHubRepository'),
  GitHubService: Symbol.for('IGitHubService'),
  GoogleSheetsClient: Symbol.for('IGoogleSheetsClient'),
  GoogleSheetsMetricModel: Symbol.for('GoogleSheetsMetricModel'),
  GoogleSheetsRepository: Symbol.for('IGoogleSheetsRepository'),
  GoogleSheetsService: Symbol.for('GoogleSheetsService'),
  HealthCheckController: Symbol.for('IHealthCheckController'),
  JobQueueService: Symbol.for('IJobQueueService'),
  JwtService: Symbol.for('IJwtService'),
  LogFormat: Symbol.for('LogFormat'),
  LogLevel: Symbol.for('LogLevel'),
  Logger: Symbol.for('ILogger'),
  MetricCalculator: Symbol.for('IMetricCalculator'),
  MetricsController: Symbol.for('IMetricsController'),
  MetricsService: Symbol.for('IMetricsService'),
  MongoAdapter: Symbol.for('IMongoAdapter'),
  MongoDbClient: Symbol.for('MongoDbClient'),
  ProcessingService: Symbol.for('IProcessingService'),
  ProgressTracker: Symbol.for('IProgressTracker'),
  RateLimitConfig: Symbol.for('IRateLimitConfig'),
  RateLimitMiddleware: Symbol.for('IRateLimitMiddleware'),
  RepositoryManagementService: Symbol.for('IRepositoryManagementService'),
  RepositoryModel: Symbol.for('IRepositoryModel'),
  RepositoryRepository: Symbol.for('IRepositoryRepository'),
  ScheduledTaskService: Symbol.for('IScheduledTaskService'),
  SecurityHeadersConfig: Symbol.for('ISecurityHeadersConfig'),
  SecurityHeadersMiddleware: Symbol.for('ISecurityHeadersMiddleware'),
  SecurityLogger: Symbol.for('ISecurityLogger'),
  TeamHealthDashboardApp: Symbol.for('ITeamHealthDashboardApp'),
  TokenBlacklistService: Symbol.for('ITokenBlacklistService'),
  TokenService: Symbol.for('ITokenService'),
  UserModel: Symbol.for('IUserModel'),
  UserRepository: Symbol.for('IUserRepository'),
  UserService: Symbol.for('IUserService'),
};
