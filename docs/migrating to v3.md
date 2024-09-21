# Migrating to Target Architecture v3

## Introduce Cross-cutting Concerns

- Ensure all parts of the application allow errors to bubble up to the ErrorHandler middleware.
- Extend ErrorHandler if necessary to handle any new error types introduced during refactoring.
- Review error handling in the context of the new layer separation, ensuring that errors are properly propagated through the layers.

## Implement Consistent Repository Pattern - [DONE]

Existing: We have GitHubRepository and GoogleSheetsRepository using adapters.
Adjustment: The main task here is to create a MongoAdapter for UserRepository to be consistent with other repositories.

- Create a MongoAdapter class that wraps all MongoDB operations.
- Refactor UserRepository to use the new MongoAdapter instead of directly using MongoDbClient.
- Ensure GitHubRepository and GoogleSheetsRepository are consistently using their respective adapters.

## Refactor Authentication and User Management - [DONE]

Existing: We have an AuthService that handles both authentication and user management.
Adjustment: This step is valid. We need to split AuthService into AuthenticationService and UserService.

- Split the existing AuthService into separate AuthenticationService and UserService.
- Move user-related operations (e.g., registration, profile updates) to UserService.
- Keep authentication-related operations (e.g., login, token refresh) in AuthenticationService.

## Implement TokenManagementService

Existing: We already have separate TokenService and TokenBlacklistService.
Adjustment: This step is valid. Combining these into a single TokenManagementService would improve cohesion.

- Create a new TokenManagementService that combines functionality from existing TokenService and TokenBlacklistService.
- Refactor AuthenticationService to use the new TokenManagementService.

## Introduce HealthCheckService

Existing: HealthCheckController directly uses MongoDbClient.
Adjustment: This step is valid. Creating a HealthCheckService would improve separation of concerns.

- Create a new HealthCheckService that encapsulates health check logic.
- Refactor HealthCheckController to use the new HealthCheckService instead of directly accessing MongoDbClient.

## Refactor MetricCalculator - [DONE]

Existing: MetricCalculator is used by GitHubRepository.
Adjustment: Moving it to the Business Logic layer (likely within MetricsService) is a valid step to improve reusability.

- Move MetricCalculator to the Business Logic layer.
- Refactor MetricsService to use MetricCalculator, making it independent of specific data sources.

## Enhance SSEService - [DEPRECATED]

Existing: SSEService is already implemented but tightly coupled with MetricsController.
Adjustment: This step is valid. We need to make SSEService more generic and move it to the Business Logic layer.

- Refactor SSEService to be more generic and reusable across different controllers.
- Move SSEService to the Business Logic layer.

## Implement Clear Layer Separation - [DONE]

Existing: The codebase already has some layer separation, but it's not entirely clear.
Adjustment: This step is more about reorganization and ensuring clear boundaries between layers.

- Organize the codebase into clear Presentation, Business Logic, and Data Access layers.
- Ensure that dependencies flow in the correct direction (Presentation -> Business Logic -> Data Access).

## Refine Middleware

Existing: We have various middleware implementations.
Adjustment: This step is about ensuring consistency and possibly adding AuthenticationMiddleware if not already present.

- Ensure all middleware is correctly grouped and applied at the application level.
- Implement any missing middleware (e.g., AuthenticationMiddleware if not already present).

## Update Controllers

Existing: Controllers are already implemented but may need adjustments.
Adjustment: This step is valid as controllers will need updates to work with the refactored services.

- Refactor controllers to use the newly created or refactored services.
- Ensure controllers are thin and mainly responsible for handling HTTP requests and responses.

## Review and Enhance Error Handling

- Ensure all parts of the application allow errors to bubble up to the ErrorHandler middleware.
- Extend ErrorHandler if necessary to handle any new error types introduced during refactoring.
- Review error handling in the context of the new layer separation, ensuring that errors are properly propagated through the layers.

## Update Dependency Injection

Existing: We're using InversifyJS for dependency injection.
Adjustment: This step is valid as we'll need to update the container with new and refactored services.

- Update the dependency injection container to reflect the new service structure and dependencies.

## Incremental Testing and Deployment

- Implement and update unit tests for each refactored component.
- Conduct thorough integration testing as components are refactored.
- Deploy changes incrementally, possibly using feature flags for larger changes.

## Documentation

- Update API documentation to reflect any changes in endpoints or request/response structures.

Performance Monitoring:

- Implement or update performance monitoring to ensure the refactored components maintain or improve system performance.

## Cleanup and Optimization

- Remove any deprecated code or unused dependencies resulting from the refactoring.
- Optimize the new structure based on performance metrics and team feedback.

## Migration Strategy

- Prioritize changes: Start with changes that provide the most value or address the most pressing issues.
- Incremental approach: Implement changes in small, manageable increments rather than a big bang approach.
- Maintain backwards compatibility: Ensure that changes don't break existing functionality.
- Continuous integration: Regularly integrate changes to catch and address integration issues early.
