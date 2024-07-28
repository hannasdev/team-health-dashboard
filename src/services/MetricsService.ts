// src/services/MetricsService.ts
// src/services/MetricsService.ts
import {
  GoogleSheetsService,
  IGoogleSheetsClient,
} from "./GoogleSheetsService";
import { GitHubService, IGitHubClient } from "./GitHubService";
import { IMetric } from "../interfaces/IMetricModel";
import { IMetricsService } from "../interfaces/IMetricsService";
import { IGoogleSheetsService } from "../interfaces/IGoogleSheetsService";
import { IGitHubService } from "../interfaces/IGitHubService";

interface ServiceError {
  source: string;
  message: string;
}

export class MetricsService implements IMetricsService {
  private googleSheetsService: IGoogleSheetsService;
  private gitHubService: IGitHubService;

  constructor(
    googleSheetsClient: IGoogleSheetsClient,
    gitHubClient: IGitHubClient,
    private spreadsheetId: string,
    private owner: string,
    private repo: string
  ) {
    this.googleSheetsService = new GoogleSheetsService(
      googleSheetsClient,
      spreadsheetId
    );
    this.gitHubService = new GitHubService(gitHubClient, owner, repo);
  }

  async getAllMetrics(): Promise<{
    metrics: IMetric[];
    errors: ServiceError[];
  }> {
    const errors: ServiceError[] = [];
    let sheetData: IMetric[] = [];
    let githubData: IMetric[] = [];

    try {
      sheetData = await this.googleSheetsService.fetchData();
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
      errors.push({
        source: "Google Sheets",
        message: "Failed to fetch Google Sheets data",
      });
    }

    try {
      githubData = await this.gitHubService.fetchData();
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      errors.push({ source: "GitHub", message: "Failed to fetch GitHub data" });
    }

    const metrics = [...sheetData, ...githubData];

    return { metrics, errors };
  }
}

export default MetricsService;
