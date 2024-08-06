# Team Health Dashboard

## Project Summary

The Team Health Dashboard is designed to provide Engineering Managers with insights into their team's performance and health. It aggregates data from multiple sources (Google Sheets and GitHub) to calculate and display various metrics. The goal is to track team productivity, identify bottlenecks, and maintain overall team health.

## Key Requirements

1. Fetch and process data from Google Sheets (for manual metrics)
2. Fetch and process data from GitHub (for automated metrics)
3. Calculate and display team health metrics
4. Provide a backend API for the dashboard frontend
5. Implement with TypeScript for type safety and better maintainability
6. Follow Object-Oriented Programming (OOP) principles
7. Adhere to Test-Driven Development (TDD) practices

## Architecture and Tech Stack

- **Backend**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB
- **Testing**: Jest
- **API Integrations**: Google Sheets API, GitHub API (via GraphQL)
- **Architecture Style**: Modular, Service-Oriented
- **Frontend**: React with a charting library like Recharts or Chart.js
- **Authentication**: Via user account and JWT
- **Containerization**: Via Docker
- **Hosting**: Cloud platforms like AWS, Google Cloud, or Azure for scalability

## Metrics to Collect

### Repository Pattern Implementation

We've implemented the Repository pattern for data access abstraction:

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

class GoogleSheetRepository implements IRepository<GoogleSheetData> {
  // Google Sheets-specific implementation
}

class UserRepository implements IRepository<User> {
  // User-specific implementation
}
```

### Adapter Pattern Implementation

We've implemented the Adapter pattern to standardize data from different sources:

```typescript
interface IAdapter<T, U> {
  adapt(data: T): U;
}

class GitHubAdapter implements IAdapter<GitHubData, Metric> {
  adapt(data: GitHubData): Metric {
    // Convert GitHub data to Metric
  }
}

class GoogleSheetAdapter implements IAdapter<GoogleSheetData, Metric> {
  adapt(data: GoogleSheetData): Metric {
    // Convert Google Sheet data to Metric
  }
}
```

### Metrics Service

The MetricsService uses repositories and adapters to fetch and process data:

```typescript
class MetricsService {
  constructor(
    private githubRepo: GitHubRepository,
    private googleSheetRepo: GoogleSheetRepository,
    private githubAdapter: GitHubAdapter,
    private googleSheetAdapter: GoogleSheetAdapter,
  ) {}

  async getAllMetrics(): Promise<Metric[]> {
    const githubData = await this.githubRepo.findAll();
    const googleSheetData = await this.googleSheetRepo.findAll();

    const githubMetrics = githubData.map(this.githubAdapter.adapt);
    const googleSheetMetrics = googleSheetData.map(
      this.googleSheetAdapter.adapt,
    );

    return [...githubMetrics, ...googleSheetMetrics];
  }
}
```

## Metrics Collected

1. **Sprint Velocity** (Google Sheets)
2. **Sprint Burndown** (Google Sheets)
3. **Cycle Time** (Google Sheets)
4. **Code Review Time** (GitHub)
5. **Pull Request Size** (GitHub)
6. **Build Success Rate** (GitHub)
7. **Bug Resolution Time** (Google Sheets)
8. **Work in Progress (WIP) Items** (Google Sheets)
9. **Sprint Goal Achievement Rate** (Google Sheets)
10. **Team Happiness Index** (Google Sheets)

## Data Integration

- GitHub data is fetched using the GitHub GraphQL API
- Google Sheets data is fetched using the Google Sheets API
- Data is processed and standardized using the Adapter pattern
- Processed data is stored in MongoDB for quick retrieval and historical tracking

## Testing Strategy

- Unit tests for individual components (repositories, adapters, services)
- Integration tests for database operations and API integrations
- End-to-end tests for critical workflows
- Use of Jest for testing framework
- Implementation of test doubles (mocks, stubs) for external dependencies
- Continuous Integration (CI) to run tests on each commit

## Future Considerations

1. Implement real-time updates for certain metrics
2. Develop customizable dashboards for different roles
3. Implement an alerting system for metric thresholds
4. Develop trend analysis and forecasting features
5. Add more data sources (e.g., Jira, Slack)
6. Implement caching strategies for improved performance

## Conclusion

The Team Health Dashboard now has a solid foundation with the implementation of the Repository and Adapter patterns. This architecture provides a clear separation of concerns, making it easier to maintain and extend the system. The next steps involve implementing the frontend dashboard and setting up the deployment pipeline.
