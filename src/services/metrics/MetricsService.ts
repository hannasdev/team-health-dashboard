// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';

import { ProgressCallback } from '../../types';
import { Logger } from '../../utils/Logger';
import { TYPES } from '../../utils/types';

import type {
  IMetricsService,
  IMetric,
  IGoogleSheetsService,
  IGitHubService,
} from '../../interfaces/index';

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
 * @implements {IMetricsService}
 */
@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.GitHubService) private gitHubService: IGitHubService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  /**
   * Fetches all metrics from various sources and aggregates them.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for reporting progress.
   * @param {number} [timePeriod=90] - Time period in days for which to fetch metrics (default is 90 days).
   * @returns {Promise<{metrics: IMetric[]; errors: {source: string; message: string}[]; githubStats: {totalPRs: number; fetchedPRs: number; timePeriod: number}}>}
   *          A promise that resolves to an object containing:
   *          - metrics: An array of deduplicated metrics from all sources.
   *          - errors: An array of errors encountered during data fetching, if any.
   *          - githubStats: Statistics about the GitHub data fetch, including total PRs, fetched PRs, and the time period.
   * @throws Will throw an error if both data sources fail to fetch data.
   */
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

    const createGoogleSheetsProgressCallback = (
      source: string,
      offset: number,
    ) => {
      return (progress: number, message: string) => {
        const adjustedProgress = offset + (progress / 100) * 50;
        progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
      };
    };

    const createGitHubProgressCallback = (
      source: string,
      offset: number,
    ): ProgressCallback => {
      return (current: number, total: number, message: string) => {
        const adjustedProgress = offset + (current / total) * 50;
        progressCallback?.(adjustedProgress, 100, `${source}: ${message}`);
      };
    };

    try {
      progressCallback?.(0, 100, 'Google Sheets: Starting to fetch data');
      const googleSheetsData = await this.googleSheetsService.fetchData(
        createGoogleSheetsProgressCallback('Google Sheets', 0),
      );
      allMetrics = [...allMetrics, ...googleSheetsData];
      progressCallback?.(50, 100, 'Google Sheets: Finished fetching data');
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      progressCallback?.(50, 100, 'GitHub: Starting to fetch data');
      const githubData = await this.gitHubService.fetchData(
        createGitHubProgressCallback('GitHub', 50),
        timePeriod,
      );
      allMetrics = [...allMetrics, ...githubData.metrics];
      githubStats = {
        totalPRs: githubData.totalPRs,
        fetchedPRs: githubData.fetchedPRs,
        timePeriod: githubData.timePeriod,
      };
      progressCallback?.(100, 100, 'GitHub: Finished fetching data');
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const uniqueMetrics = this.deduplicateMetrics(allMetrics);

    return { metrics: uniqueMetrics, errors, githubStats };
  }

  /**
   * Deduplicates an array of metrics based on their IDs.
   * If there are multiple metrics with the same ID, the one with the latest timestamp is kept.
   *
   * @private
   * @param {IMetric[]} metrics - The array of metrics to deduplicate.
   * @returns {IMetric[]} An array of deduplicated metrics.
   */
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
