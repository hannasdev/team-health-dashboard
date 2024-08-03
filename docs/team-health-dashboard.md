# Team Health Dashboard

## Metrics to Collect

1. **Sprint Velocity**

   - Purpose: Track team's productivity and capacity over time
   - Data Source: Shortcut via Google Sheets
   - Calculation: Sum of story points completed per sprint

2. **Sprint Burndown**

   - Purpose: Monitor sprint progress and identify potential delays
   - Data Source: Shortcut via Google Sheets
   - Visualization: Daily remaining work vs ideal burndown line

3. **Cycle Time**

   - Purpose: Measure efficiency in completing tasks
   - Data Source: Shortcut via Google Sheets
   - Calculation: Average time from "In Progress" to "Done"

4. **Code Review Time**

   - Purpose: Ensure timely feedback and prevent bottlenecks
   - Data Source: GitHub API
   - Calculation: Average time between PR creation and merge

5. **Pull Request Size**

   - Purpose: Encourage smaller, more manageable changes
   - Data Source: GitHub API
   - Calculation: Average lines of code per PR

6. **Build Success Rate**

   - Purpose: Monitor code quality and integration issues
   - Data Source: GitHub Actions or your CI/CD tool
   - Calculation: Percentage of successful builds

7. **Bug Resolution Time**

   - Purpose: Track team's responsiveness to issues
   - Data Source: Shortcut via Google Sheets
   - Calculation: Average time from bug report to resolution

8. **Work in Progress (WIP) Items**

   - Purpose: Prevent overcommitment and context switching
   - Data Source: Shortcut via Google Sheets
   - Calculation: Number of items in "In Progress" status

9. **Sprint Goal Achievement Rate**

   - Purpose: Measure team's ability to meet sprint commitments
   - Data Source: Manual input or Shortcut via Google Sheets
   - Calculation: Percentage of sprints where all committed items were completed

10. **Team Happiness Index**
    - Purpose: Gauge team morale and satisfaction
    - Data Source: Regular anonymous surveys (could be integrated into the dashboard)
    - Calculation: Average score from 1-10 on team satisfaction questions

## Data Integration

- Primary data sources: GitHub API, Shortcut via Google Sheets
- Consider using Google Apps Script to automate data pulling from Google Sheets
- Use a backend service (e.g., Node.js) to fetch data from GitHub API and process it
- Store processed data in a database for quick retrieval and historical tracking

## Dashboard Features

- Real-time data updates
- Customizable date ranges for trend analysis
- Alert system for metrics falling outside of acceptable ranges
- Export functionality for reports
- User-specific views (e.g., manager view, team member view)

## Technical Considerations

- Frontend: React with a charting library like recharts or Chart.js
- Backend: Node.js with Express
- Database: MongoDB for flexible schema
- Authentication: Integrate with your company's SSO if available
- Hosting: Consider cloud platforms like AWS, Google Cloud, or Azure for scalability
