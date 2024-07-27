// src/services/MetricsService.ts
import { IMetric, Metric } from "import { IMetric } from '../models/Metric';
import { GoogleSheetsService } from './GoogleSheetsService';
import { GitHubService } from './GitHubService';

export class MetricsService {
  constructor(
    private googleSheetsService: GoogleSheetsService,
    private gitHubService: GitHubService
  ) {}

  async getMetrics(): Promise<IMetric[]> {
    const [sheetData, githubData] = await Promise.all([
      this.googleSheetsService.fetchData(),
      this.gitHubService.fetchData()
    ]);

    return [...sheetData, ...githubData];
  }
}