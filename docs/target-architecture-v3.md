# Target Architecture v3

## Current Architecture (as of Sep 5, 2024)

```mermaid
classDiagram
    App --> MetricsRouter
    App --> AuthRouter
    App --> HealthCheckRouter
    App --> MiddlewareGroup

    MetricsRouter --> MetricsController
    AuthRouter --> AuthController
    HealthCheckRouter --> HealthCheckController

    MetricsController --> MetricsService
    MetricsController --> SSEService
    AuthController --> AuthenticationService
    AuthController --> UserService
    AuthController --> ApiResponse
    HealthCheckController --> MongoDbClient
    HealthCheckController --> ApiResponse

    MetricsService --> GitHubRepository
    MetricsService --> GoogleSheetsRepository
    MetricsService --> MetricCalculator
    MetricsService --> ProgressTracker
    SSEService --> ApiResponse

    AuthenticationService --> TokenService
    AuthenticationService --> UserRepository
    AuthenticationService --> TokenBlacklistService
    AuthenticationService --> BcryptService
    UserService --> UserRepository

    TokenService --> JwtService
    TokenBlacklistService --> TokenBlacklistRepository

    GitHubRepository --> GitHubAdapter
    GoogleSheetsRepository --> GoogleSheetsAdapter

    UserRepository --> MongoAdapter
    GitHubRepository --> MongoAdapter
    GoogleSheetsRepository --> MongoAdapter
    TokenBlacklistRepository --> MongoAdapter

    GitHubRepository ..> CacheService
    GoogleSheetsRepository ..> CacheService

    App --> Config
    App --> Logger

    MiddlewareGroup --> AuthMiddleware
    AuthMiddleware --> TokenService
    AuthMiddleware --> SSEService

    class App {
        +express: Express
        +configureCors()
        +configureMiddleware()
        +configureRoutes()
        +configureErrorHandling()
        +initialize()
    }

    class MiddlewareGroup {
        ErrorHandlerMiddleware
        LoggingMiddleware
        AuthMiddleware
        CorsMiddleware
        BodyParserMiddleware
        SecurityHeadersMiddleware
    }

    class MetricsService {
        <<implements IMetricsService>>
        +getAllMetrics(progressCallback, timePeriod)
        +cancelOperation()
    }

    class GitHubRepository {
        <<implements IGitHubRepository>>
        +fetchPullRequests(timePeriod, progressCallback)
        +cancelOperation()
    }

    class GoogleSheetsRepository {
        <<implements IGoogleSheetsRepository>>
        +fetchMetrics(progressCallback)
    }

    class MetricCalculator {
        <<implements IMetricCalculator>>
        +calculateMetrics(pullRequests)
    }

    class ProgressTracker {
        +trackProgress(current, total, message)
        +setReportInterval(interval)
    }

    class SSEService {
        <<implements ISSEService>>
        +createConnection(id, res)
        +sendEvent(connectionId, event, data)
        +endConnection(connectionId)
        +handleClientDisconnection(connectionId)
    }

    class ApiResponse {
        <<implements IApiResponse>>
        +createSuccessResponse(data)
        +createErrorResponse(message, details, statusCode)
    }

    class MetricsController {
        +getAllMetrics(req, res, next, timePeriod)
    }

    class AuthController {
        +register(req, res, next)
        +login(req, res, next)
        +refreshToken(req, res, next)
        +logout(req, res, next)
    }

    class AuthenticationService {
        +login(email, password)
        +refreshToken(refreshToken)
        +logout(refreshToken)
    }

    class UserService {
        +registerUser(email, password)
        +getUserById(id)
        +updateUserProfile(id, data)
    }

    class HealthCheckController {
        +getHealth(req, res)
    }

    class TokenService {
        +generateAccessToken(payload)
        +generateRefreshToken(payload)
        +validateAccessToken(token)
        +validateRefreshToken(token)
    }

    class TokenBlacklistService {
        +blacklistToken(token, expiresAt)
        +isTokenBlacklisted(token)
    }

    class UserRepository {
        <<implements IUserRepository>>
        +findByEmail(email)
        +create(email, password)
        +findById(id)
    }

    class JwtService {
        +sign(payload, secret, options)
        +verify(token, secret)
    }

    class BcryptService {
        +hash(data, saltOrRounds)
        +compare(data, encrypted)
    }

    class GitHubAdapter {
        <<implements IGitHubClient>>
        +graphql(query, variables)
    }

    class GoogleSheetsAdapter {
        <<implements IGoogleSheetsClient>>
        +getValues(spreadsheetId, range)
    }

    class MongoAdapter {
        +getCollection(name)
        +getDb()
    }

    class Logger {
        +info(message, meta)
        +error(message, error, meta)
        +warn(message, meta)
        +debug(message, meta)
    }

    class Config {
        +getInstance()
        +get propertyName()
    }

    class MongoDbClient {
        <<implements IMongoDbClient>>
        +connect()
        +getDb()
        +close()
    }

    class CacheService {
        +get(key)
        +set(key, value, ttl)
        +delete(key)
        +clear()
    }
```

## Motivation for the new Target Architecture

A reflection on the current state of architecture, and potential improvements.

### Inconsistent Repository Pattern

Issue: GitHubRepository and GoogleSheetsRepository are using adapters (GitHubAdapter and GoogleSheetsAdapter), while UserRepository directly uses MongoDbClient.
Improvement: Consider introducing a MongoAdapter to maintain consistency across repositories. This would provide a uniform interface for database operations and make it easier to switch databases if needed.

### MetricCalculator Placement

Issue: MetricCalculator is tied directly to GitHubRepository, which might limit its reusability.
Improvement: Consider moving MetricCalculator to the service layer, possibly as part of MetricsService. This would allow it to be used with data from multiple sources, not just GitHub.

### Direct Database Access in HealthCheckController

Issue: HealthCheckController directly uses MongoDbClient, bypassing the repository layer.
Improvement: Introduce a HealthCheckService that encapsulates the health check logic, including database checks. This maintains separation of concerns and consistency with other controllers.

### SSEService Coupling

Issue: SSEService is tightly coupled with MetricsController and ApiResponse.
Improvement: Consider making SSEService more generic, possibly moving it to a middleware or utility layer. This would allow it to be used by other controllers if needed.

### Config and Logger Usage

Issue: While Config and Logger are shown connected to App, their usage across other components isn't clear.
Improvement: Consider showing these as cross-cutting concerns, perhaps by indicating that they can be injected into any component.

### AuthService Responsibilities

Issue: AuthService seems to handle both authentication and user management.
Improvement: Consider splitting this into separate services: AuthService for authentication/authorization and UserService for user management operations.

### Lack of Clear Layer Separation

Issue: The diagram doesn't clearly show the separation between different layers (e.g., presentation, business logic, data access).
Improvement: Reorganize the diagram to clearly show these layers, which would make the architecture easier to understand and maintain.

### TokenService and TokenBlacklistService Separation

Issue: These two services are closely related but separated.
Improvement: Consider merging them into a single TokenManagementService to encapsulate all token-related operations.

### Middleware Representation

Issue: Middleware is grouped but its interaction with the application flow isn't clear.
Improvement: Consider showing how middleware integrates into the request processing pipeline.

### Error Handling

Issue: Error handling isn't clearly represented in the architecture.
Improvement: Consider adding a global error handling mechanism or service that works across all layers of the application.

Here's a high-level description of an improved target architecture:

- Clearly defined layers: Presentation (Controllers), Business Logic (Services), Data Access (Repositories with consistent Adapter usage).
  Cross-cutting concerns (Logging, Configuration) available to all layers.
- Consistent pattern usage across similar components (e.g., all repositories using adapters).
- Clear separation of responsibilities (e.g., separate Authentication and User Management services).
- Generic, reusable components (e.g., a more flexible SSEService, generalized MetricCalculator).
- Clear error handling and middleware integration.

## Target Architecture

```mermaid
classDiagram
      %% Layers
    class PresentationLayer
    class BusinessLogicLayer
    class DataAccessLayer

     %% Cross-cutting Concerns
    class CrossCuttingConcerns {
        Logger
        Config
        CacheService
        ApiResponse
    }

    %% Presentation Layer
    PresentationLayer --> App
    PresentationLayer --> MiddlewareGroup
    PresentationLayer --> MetricsController
    PresentationLayer --> AuthController
    PresentationLayer --> HealthCheckController

    %% Business Logic Layer
    BusinessLogicLayer --> MetricsService
    BusinessLogicLayer --> AuthenticationService
    BusinessLogicLayer --> UserService
    BusinessLogicLayer --> HealthCheckService
    BusinessLogicLayer --> TokenManagementService
    BusinessLogicLayer --> MetricCalculator
    BusinessLogicLayer --> SSEService
    BusinessLogicLayer --> ProgressTracker

    %% Data Access Layer
    DataAccessLayer --> UserRepository
    DataAccessLayer --> GitHubRepository
    DataAccessLayer --> GoogleSheetsRepository
    DataAccessLayer --> TokenBlacklistRepository

    %% Adapters
    DataAccessLayer --> MongoAdapter
    DataAccessLayer --> GitHubAdapter
    DataAccessLayer --> GoogleSheetsAdapter

    %% Connections between layers
    App --> MetricsController
    App --> AuthController
    App --> HealthCheckController
    App ..> CrossCuttingConcerns

    MetricsController --> MetricsService
    MetricsController --> SSEService
    AuthController --> AuthenticationService
    AuthController --> UserService
    HealthCheckController --> HealthCheckService

    MetricsService --> GitHubRepository
    MetricsService --> GoogleSheetsRepository
    MetricsService --> MetricCalculator
    MetricsService --> ProgressTracker
    AuthenticationService --> TokenManagementService
    AuthenticationService --> UserService
    AuthenticationService --> BcryptService
    UserService --> UserRepository
    UserService --> BcryptService
    HealthCheckService --> MongoAdapter
    TokenManagementService --> TokenBlacklistRepository
    TokenManagementService --> JwtService

    GitHubRepository --> GitHubAdapter
    GoogleSheetsRepository --> GoogleSheetsAdapter
    UserRepository --> MongoAdapter
    TokenBlacklistRepository --> MongoAdapter

    %% New connections
    MiddlewareGroup --> AuthMiddleware
    MiddlewareGroup --> ErrorHandlerMiddleware
    AuthMiddleware --> TokenManagementService
    AuthMiddleware --> SSEService

    GitHubRepository ..> CacheService
    GoogleSheetsRepository ..> CacheService

    %% Class definitions
    class App {
        +configureMiddleware()
        +configureRoutes()
        +start()
    }

    class MiddlewareGroup {
        ErrorHandlerMiddleware
        LoggingMiddleware
        AuthMiddleware
        CorsMiddleware
        BodyParserMiddleware
    }

    class ErrorHandlerMiddleware {
        +handle(err, req, res, next)
    }

    class AuthMiddleware {
        +handle(req, res, next)
        -handleSSEAuth(req, res, next, decoded)
        -isTokenExpired(decoded)
        -handleTokenRefresh(token, refreshToken, req, res)
    }

    class MetricsController {
        +getAllMetrics(req, res, next)
    }

    class AuthController {
        +register(req, res, next)
        +login(req, res, next)
        +refreshToken(req, res, next)
        +logout(req, res, next)
    }

    class HealthCheckController {
        +getHealth(req, res)
    }

    class MetricsService {
        +getAllMetrics(timePeriod, progressCallback)
        +cancelOperation()
    }

    class AuthenticationService {
        +login(email, password)
        +logout(refreshToken)
        +refreshToken(refreshToken)
    }

    class UserService {
        +registerUser(email, password)
        +getUserById(id)
        +updateUser(id, data)
    }

    class HealthCheckService {
        +performHealthCheck()
    }

    class TokenManagementService {
        +generateAccessToken(payload)
        +generateRefreshToken(payload)
        +validateToken(token)
        +blacklistToken(token)
    }

    class MetricCalculator {
        +calculateMetrics(data)
    }

    class SSEService {
        +initialize(res)
        +sendEvent(event, data)
        +endResponse()
        +handleClientDisconnection()
        +handleError(error)
    }

    class ProgressTracker {
        +trackProgress(current, total, message)
        +getProgress()
    }

    class GitHubRepository {
        +fetchPullRequests(timePeriod, progressCallback)
        +cancelOperation()
    }

    class GoogleSheetsRepository {
        +getMetricsData(progressCallback)
    }

    class TokenBlacklistRepository {
        +addToBlacklist(token, expiresAt)
        +isBlacklisted(token)
        +removeExpired()
    }

    class CacheService {
        +get(key)
        +set(key, value, ttl)
        +delete(key)
        +clear()
    }

    class BcryptService {
        +hash(data, saltOrRounds)
        +compare(data, encrypted)
    }

    class JwtService {
        +sign(payload, secret, options)
        +verify(token, secret)
    }

    class MongoAdapter {
        +getCollection(name)
        +getDb()
    }
```
