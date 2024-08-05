# Updated Design Document

## Architecture Overview

Our application follows a clean, layered architecture based on MVC principles, with a focus on separation of concerns and maintainability. The key components are:

1. **Model Layer**: Represents the data and business logic.
2. **View Layer**: In our API context, this is the JSON response structure.
3. **Controller Layer**: Handles incoming requests and returns responses.
4. **Service Layer**: Contains the core business logic.
5. **Data Access Layer**: Manages data retrieval and storage.

## Key Components

### Data Source Abstraction

We use the Repository pattern for abstracting data access:

```typescript
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: T): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

class GitHubRepository implements IRepository<GitHubData> {
  // GitHub-specific implementation
}

class GoogleSheetsRepository implements IRepository<GoogleSheetsData> {
  // Google Sheets-specific implementation
}
```

### Repository Pattern Implementation

The Repository pattern provides a clean separation between the data access logic and the business logic of an application. It also allows us to centralize data access logic, making it easier to maintain and modify as requirements change.

```typescript
class MetricsRepository implements IRepository<Metric> {
  constructor(
    private githubRepo: GitHubRepository,
    private googleSheetsRepo: GoogleSheetsRepository,
  ) {}

  async findAll(): Promise<Metric[]> {
    const githubData = await this.githubRepo.findAll();
    const googleSheetsData = await this.googleSheetsRepo.findAll();
    // Combine and transform data into Metrics
    // ...
  }

  // Implement other methods...
}
```

### Metric Calculator Implementation

Separate calculators for each data source maintain clear responsibilities:

```typescript
interface IMetricCalculator {
  calculateMetrics(data: any[]): IMetric[];
}

class GitHubMetricCalculator implements IMetricCalculator {
  // GitHub-specific metric calculations
}

class GoogleSheetsMetricCalculator implements IMetricCalculator {
  // Google Sheets-specific metric calculations
}
```

### Progress Tracker Integration

A separate utility class injected where needed:

```typescript
interface IProgressTracker {
  trackProgress(current: number, total: number, message: string): void;
  setReportInterval(interval: number): void;
}

type ProgressCallback = (
  current: number,
  total: number,
  message: string,
) => void;
```

### Caching Strategy

A CacheService injected into adapters or services:

```typescript
interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### Error Handling

Consistent error handling using custom error classes:

```typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

class DataFetchError extends AppError {
  constructor(source: string, message: string) {
    super(500, `Error fetching data from ${source}: ${message}`);
  }
}
```

### Dependency Injection

We use InversifyJS for dependency injection, defining interfaces for all major components and binding them in a central container. This includes our new repository interfaces and implementations.

### Configuration Management

We use a centralized `config.ts` approach, injecting the config where needed.

## New Improvements

### Enhanced Controller and Route Separation

Controllers focus on request handling logic, while route definitions are kept separate:

```typescript
// Controller
export class MetricsController {
  constructor(private metricsService: IMetricsService) {}

  async getMetrics(req: Request, res: Response, next: NextFunction) {
    // Implementation
  }
}

// Route
export const createMetricsRouter = (metricsController: MetricsController) => {
  const router = Router();
  router.get('/metrics', metricsController.getMetrics.bind(metricsController));
  return router;
};
```

### Expanded Model Layer

Models now include data transformation and validation logic:

```typescript
export class Metric {
  constructor(
    public name: string,
    public value: number,
    public timestamp: Date,
  ) {}

  static fromRawData(data: any): Metric {
    // Logic to create a Metric instance from raw data
  }

  toJSON() {
    // Logic to convert Metric to JSON
  }
}
```

### Additional Middleware

We've added the following middleware for improved functionality and security:

- Request logging middleware
- CORS middleware
- Body parsing middleware
- Security headers middleware (using helmet)

### API Documentation

We're implementing OpenAPI/Swagger documentation for all API endpoints.

### Docker Configuration

We've added Dockerfile and docker-compose.yml for containerization.

### Environment Configuration

We ensure proper management of environment-specific configurations, especially for Docker environments.

### Improved Logging

We've implemented a robust logging solution using winston with proper log levels and formats.

### Health Check Endpoint

We've added a health check endpoint for monitoring service status in containerized environments.

## Testing Strategy

Our testing strategy remains focused on:

- Using mock factories for dependencies
- Following Arrange-Act-Assert pattern
- Writing unit tests, integration tests, and end-to-end tests
- Emphasizing test-driven development (TDD)
- Ensuring high test coverage with meaningful tests

With the introduction of the Repository pattern, our testing strategy now includes:

- Unit tests for individual repository implementations (GitHubRepository, GoogleSheetsRepository)
- Unit tests for the MetricsRepository, using mocks for the underlying repositories
- Integration tests that verify the correct interaction between the MetricsService and the MetricsRepository

## Conclusion

These improvements enhance our architecture's alignment with MVC principles and best practices for a TypeScript Node.js API service running in a Docker container. The result is a more maintainable, scalable, and robust application.

The introduction of the Repository pattern enhances our architecture by providing a more standardized approach to data access. This change improves the separation of concerns, making our codebase more maintainable and adaptable to future changes in data sources or business requirements.
