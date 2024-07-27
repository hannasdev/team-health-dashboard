# Team Health Dashboard Project Summary

## Project Scope
The Team Health Dashboard is designed to provide Engineering Managers with insights into their team's performance and health. It aggregates data from multiple sources (Google Sheets and GitHub) to calculate and display various metrics.

## Key Requirements
1. Fetch and process data from Google Sheets (for manual metrics)
2. Fetch and process data from GitHub (for automated metrics)
3. Calculate and display team health metrics
4. Provide a backend API for the dashboard frontend
5. Implement with TypeScript for type safety and better maintainability
6. Follow Object-Oriented Programming (OOP) principles
7. Adhere to Test-Driven Development (TDD) practices

## Architecture and Tech Stack
- Backend: Node.js with Express
- Language: TypeScript
- Database: MongoDB (planned, not yet implemented)
- Testing: Jest
- API Integrations: Google Sheets API, GitHub API (via Octokit)
- Architecture Style: Modular, Service-Oriented

## Project Structure
```
/team-dashboard-backend
│
├── src/
│   ├── config/
│   ├── models/
│   ├── services/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── app.ts
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── scripts/
├── jest.config.js
├── tsconfig.json
├── .env
├── .gitignore
└── package.json
```

## Implemented Components

1. MetricsService
   - Aggregates data from GoogleSheetsService and GitHubService
   - Provides a unified interface for fetching all metrics

2. GoogleSheetsService
   - Fetches data from a specified Google Sheet
   - Parses sheet data into metric objects

3. GitHubService
   - Fetches pull request data from GitHub
   - Calculates PR Cycle Time and PR Size metrics

4. Metric Model
   - Represents individual metrics with id, name, value, and timestamp

## Testing Strategy
- Unit tests for each service and component
- Mock external dependencies (Google Sheets API, GitHub API)
- Test both happy paths and edge cases
- Aim for high test coverage

## Current Metrics
1. From Google Sheets:
   - Cycle Time
   - Work in Progress (WIP)
   - (Extensible for other manual metrics)

2. From GitHub:
   - PR Cycle Time (average time from PR creation to merge)
   - PR Size (average number of changes per PR)

## Next Steps
1. Implement MetricsController for handling API requests
2. Set up Express routes for the API
3. Implement authentication and authorization
4. Set up MongoDB for data persistence
5. Implement error handling and logging strategies
6. Develop frontend dashboard (not yet started)
7. Set up CI/CD pipeline
8. Implement caching strategy for performance optimization

## Future Considerations
- Add more data sources (e.g., Jira, Slack)
- Implement real-time updates
- Develop customizable dashboards for different roles
- Implement alerting system for metric thresholds
- Develop trend analysis and forecasting features

