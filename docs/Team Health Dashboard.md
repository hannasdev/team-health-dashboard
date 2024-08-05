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

## Project Structure

```zsh
/team-dashboard-backend
│
├── src/
│   ├── __mocks__/
│       └── mockFactories.ts
│   ├── config/
│       └── config.ts
│   ├── models/
│       ├── Metric.ts
│       └── User.ts
│   ├── services/
│       ├── cache/
│           └── CacheService.ts
│       ├── github/
│           └── GitHubService.ts
│       ├── googlesheets/
│           └── GoogleSheetsService.ts
│       ├── metrics/
│           └── MetricsCalculator.ts
│           └── MetricsService.ts
│       └── progress/
│           └── ProgressTracker.ts
│   ├── controllers/
│       └── AuthController.ts
│       └── MetricsController.ts
│   ├── interfaces/
│   ├── repositories/
│       ├── github/
│           └── GitHubRepository.ts
│       └── user/
│           └── UserRepository.ts
│   ├── routes/
│       ├── auth.ts
│       └── metrics.ts
│   ├── middleware/
│   ├── utils/
│   └── app.ts
│
├── public/
│   └── index.html
│
├── scripts/
│   └── init-mongodb.js
│
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── jest.config.js
├── jest.setup.ts
├── jsconfig.json
├── nodemon.json
├── tsconfig.json
├── .env
├── .gitignore
├── .prettierrc
└── package.json
└── package-lock.json
```

## Metrics to Collect

1. **Sprint Velocity**

   - **Purpose**: Track team's productivity and capacity over time
   - **Data Source**: Shortcut via Google Sheets
   - **Calculation**: Sum of story points completed per sprint

2. **Sprint Burndown**

   - **Purpose**: Monitor sprint progress and identify potential delays
   - **Data Source**: Shortcut via Google Sheets
   - **Visualization**: Daily remaining work vs ideal burndown line

3. **Cycle Time**

   - **Purpose**: Measure efficiency in completing tasks
   - **Data Source**: Shortcut via Google Sheets
   - **Calculation**: Average time from "In Progress" to "Done"

4. **Code Review Time**

   - **Purpose**: Ensure timely feedback and prevent bottlenecks
   - **Data Source**: GitHub API
   - **Calculation**: Average time between PR creation and merge

5. **Pull Request Size**

   - **Purpose**: Encourage smaller, more manageable changes
   - **Data Source**: GitHub API
   - **Calculation**: Average lines of code per PR

6. **Build Success Rate**

   - **Purpose**: Monitor code quality and integration issues
   - **Data Source**: GitHub Actions or your CI/CD tool
   - **Calculation**: Percentage of successful builds

7. **Bug Resolution Time**

   - **Purpose**: Track team's responsiveness to issues
   - **Data Source**: Shortcut via Google Sheets
   - **Calculation**: Average time from bug report to resolution

8. **Work in Progress (WIP) Items**

   - **Purpose**: Prevent overcommitment and context switching
   - **Data Source**: Shortcut via Google Sheets
   - **Calculation**: Number of items in "In Progress" status

9. **Sprint Goal Achievement Rate**

   - **Purpose**: Measure team's ability to meet sprint commitments
   - **Data Source**: Manual input or Shortcut via Google Sheets
   - **Calculation**: Percentage of sprints where all committed items were completed

10. **Team Happiness Index**
    - **Purpose**: Gauge team morale and satisfaction
    - **Data Source**: Regular anonymous surveys (could be integrated into the dashboard)
    - **Calculation**: Average score from 1-10 on team satisfaction questions

## Data Integration

- **Primary data sources**: GitHub API, Shortcut via Google Sheets
- Consider using Google Apps Script to automate data pulling from Google Sheets
- Use a backend service (e.g., Node.js) to fetch data from GitHub API and process it
- Store processed data in a database for quick retrieval and historical tracking

## Dashboard Features

- Real-time data updates
- Customizable date ranges for trend analysis
- Alert system for metrics falling outside of acceptable ranges
- Export functionality for reports
- User-specific views (e.g., manager view, team member view)

## Future Considerations

- Add more data sources (e.g., Jira, Slack)
- Implement real-time updates
- Develop customizable dashboards for different roles
- Implement alerting system for metric thresholds
- Develop trend analysis and forecasting features

## Additional Considerations

- Automate data collection where possible (GitHub API, Shortcut integration)
- Use existing tools and integrations to minimize manual data entry
- Regularly review the usefulness of each metric with the team
- Adjust processes based on team feedback to ensure they remain lightweight
