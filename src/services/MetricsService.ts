// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { IMetricsService } from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';
import type { IGitHubService } from '../interfaces/IGitHubService';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
  ) {}
  async getAllMetrics(): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
  }> {
    const errors: { source: string; message: string }[] = [];
    let sheetData: IMetric[] = [];
    let githubData: IMetric[] = [];

    try {
      sheetData = await this.googleSheetsService.fetchData();
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      githubData = await this.gitHubService.fetchData();
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const metrics = [...sheetData, ...githubData];

    return { metrics, errors };
  }
}

export default MetricsService;
