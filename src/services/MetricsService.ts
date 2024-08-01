// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type {
  IMetricsService,
  ProgressCallback,
} from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';
import type { IGitHubService } from '../interfaces/IGitHubService';
import type { ICacheService } from '../interfaces/ICacheService';
import { Logger } from '../utils/logger';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
    @inject(TYPES.CacheService) private cacheService: ICacheService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async getAllMetrics(progressCallback?: ProgressCallback): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
  }> {
    const errors: { source: string; message: string }[] = [];
    let allMetrics: IMetric[] = [];

    const createProgressCallback =
      (source: string, offset: number) =>
      (progress: number, message: string) => {
        progressCallback?.(offset + progress / 2, `${source}: ${message}`);
      };

    try {
      const sheetData = await this.googleSheetsService.fetchData(
        createProgressCallback('Google Sheets', 0),
      );
      allMetrics = [...allMetrics, ...sheetData];
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const githubData = await this.gitHubService.fetchData(
        createProgressCallback('GitHub', 50),
      );
      allMetrics = [...allMetrics, ...githubData];
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Deduplicate metrics based on their IDs
    const uniqueMetrics = this.deduplicateMetrics(allMetrics);

    return { metrics: uniqueMetrics, errors };
  }

  private deduplicateMetrics(metrics: IMetric[]): IMetric[] {
    const metricMap = new Map<string, IMetric>();

    for (const metric of metrics) {
      const existingMetric = metricMap.get(metric.id);
      if (!existingMetric || existingMetric.timestamp < metric.timestamp) {
        metricMap.set(metric.id, metric);
      }
    }

    return Array.from(metricMap.values());
  }
}
