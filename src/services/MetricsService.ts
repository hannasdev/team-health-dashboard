// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { IMetricsService } from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';
import type { IGitHubService } from '../interfaces/IGitHubService';
import { Logger } from '../utils/logger';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async getAllMetrics(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
  }> {
    const errors: { source: string; message: string }[] = [];
    let sheetData: IMetric[] = [];
    let githubData: IMetric[] = [];

    const createProgressCallback =
      (source: string, offset: number) =>
      (progress: number, message: string) => {
        progressCallback?.(offset + progress / 2, `${source}: ${message}`);
      };

    // Always call the initial progress callback for Google Sheets
    createProgressCallback('Google Sheets', 0)(
      0,
      'Starting to fetch Google Sheets data',
    );

    try {
      sheetData = await this.googleSheetsService.fetchData(
        createProgressCallback('Google Sheets', 0),
      );
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Always call the initial progress callback for GitHub
    createProgressCallback('GitHub', 50)(0, 'Starting to fetch GitHub data');

    try {
      githubData = await this.gitHubService.fetchData(
        createProgressCallback('GitHub', 50),
      );
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const metrics = [...sheetData, ...githubData];

    return { metrics, errors };
  }
}
