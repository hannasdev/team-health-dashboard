# Team Health Dashboard

Gathers information from your github repository and from your google sheet, to render a dashboard with relevant team statistics.

## Development

Utilises the MVC-pattern with dependency injection and inversion of control for improved testability.

```md
src/
index.ts
app.ts
container.ts
controllers/
MetricsController.ts
interfaces/
IDataService.ts
IGutHubService.ts
IGoogleSheetsService.ts
IMetricModel.ts
IMetricsService.ts
middleware/
...
models/
Metric.ts
routes/
metrics.ts
services/
GitHubService.ts
GoogleSheetsService.ts
MetricsService.ts
```
