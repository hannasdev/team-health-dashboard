// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { ProgressCallback } from '../interfaces/IMetricsService';
import type {
  IMetricsService,
  IMetric,
  IGoogleSheetsService,
  IGitHubService,
} from '../interfaces/index';
import { Logger } from '../utils/logger';

/**
 * MetricsService
 *
 * This service acts as the main orchestrator for collecting and aggregating
 * metrics data for the Team Health Dashboard. It coordinates data retrieval
 * from various sources, primarily GitHub and Google Sheets, through their
 * respective services.
 *
 * The service is responsible for:
 * - Initiating data collection from multiple sources
 * - Aggregating metrics from different services
 * - Handling errors and partial data retrieval gracefully
 * - Providing a unified interface for accessing all metrics
 * - Supporting progress tracking across all data collection processes
 *
 * It uses the GitHubService and GoogleSheetsService to fetch specific metrics,
 * combines their results, and handles any errors that occur during the process.
 * The service also manages the overall progress reporting, giving clients
 * a clear view of the data collection status.
 *
 * @implements IMetricsService
 */
@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async getAllMetrics(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }> {
    const errors: { source: string; message: string }[] = [];
    let allMetrics: IMetric[] = [];
    let githubStats = { totalPRs: 0, fetchedPRs: 0, timePeriod };

    const createProgressCallback =
      (source: string, offset: number) =>
      (progress: number, message: string) => {
        progressCallback?.(offset + progress / 2, `${source}: ${message}`);
      };

    try {
      progressCallback?.(
        0,
        'Google Sheets: Starting to fetch Google Sheets data',
      );
      const sheetData = await this.googleSheetsService.fetchData(
        createProgressCallback('Google Sheets', 0),
      );
      allMetrics = [...allMetrics, ...sheetData];
      progressCallback?.(
        50,
        'Google Sheets: Finished fetching Google Sheets data',
      );
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      progressCallback?.(50, 'GitHub: Starting to fetch GitHub data');
      const githubResult = await this.gitHubService.fetchData(
        createProgressCallback('GitHub', 50),
        timePeriod,
      );
      allMetrics = [...allMetrics, ...githubResult.metrics];
      githubStats = {
        totalPRs: githubResult.totalPRs,
        fetchedPRs: githubResult.fetchedPRs,
        timePeriod: githubResult.timePeriod,
      };
      progressCallback?.(100, 'GitHub: Finished fetching GitHub data');
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Deduplicate metrics based on their IDs
    const uniqueMetrics = this.deduplicateMetrics(allMetrics);

    return { metrics: uniqueMetrics, errors, githubStats };
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
