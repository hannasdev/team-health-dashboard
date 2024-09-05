// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';

import { ProgressCallback } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IMetricCalculator,
  IMetricsService,
  IMetric,
  IGoogleSheetsRepository,
  IGitHubRepository,
  ILogger,
} from '../../interfaces/index.js';

@injectable()
export class MetricsService implements IMetricsService {
  private isCancelled: boolean = false;

  constructor(
    @inject(TYPES.GoogleSheetsRepository)
    private googleSheetsRepository: IGoogleSheetsRepository,
    @inject(TYPES.GitHubRepository) private gitHubRepository: IGitHubRepository,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
  ) {}

  public cancelOperation(): void {
    this.isCancelled = true;
    this.gitHubRepository.cancelOperation();
    // Add similar cancellation methods for other repositories if they exist
  }

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

    const totalSteps = 2; // Google Sheets and GitHub
    let completedSteps = 0;

    const updateOverallProgress = (
      source: string,
      current: number,
      total: number,
    ) => {
      const stepProgress = current / total;
      const overallProgress =
        ((completedSteps + stepProgress) / totalSteps) * 100;
      progressCallback?.(
        Math.round(overallProgress),
        100,
        `${source}: ${Math.round(stepProgress * 100)}% complete`,
      );
    };

    try {
      const googleSheetsData = await this.googleSheetsRepository.fetchMetrics(
        (current, total, message) =>
          updateOverallProgress('Google Sheets', current, total),
      );

      if (this.isCancelled) {
        throw new AppError(499, 'Operation cancelled');
      }

      allMetrics = [...allMetrics, ...googleSheetsData];
      completedSteps++;
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isCancelled = false;
    }

    try {
      const githubData = await this.gitHubRepository.fetchPullRequests(
        timePeriod,
        (current, total, message) =>
          updateOverallProgress('GitHub', current, total),
      );

      if (this.isCancelled) {
        throw new AppError(499, 'Operation cancelled');
      }

      const githubMetrics = this.metricCalculator.calculateMetrics(
        githubData.pullRequests,
      );
      this.logger.info(`Calculated ${githubMetrics.length} GitHub metrics`);
      allMetrics = [...allMetrics, ...githubMetrics];
      githubStats = {
        totalPRs: githubData.totalPRs,
        fetchedPRs: githubData.fetchedPRs,
        timePeriod: githubData.timePeriod,
      };
      completedSteps++;
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      errors.push({
        source: 'GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isCancelled = false;
    }

    if (errors.length === 2) {
      // If both data sources failed, throw an AppError
      throw new AppError(500, 'Failed to fetch data from all sources');
    }

    progressCallback?.(100, 100, 'Completed fetching all metrics');

    const uniqueMetrics = this.deduplicateMetrics(allMetrics);

    return { metrics: uniqueMetrics, errors, githubStats };
  }

  private createProgressCallback(
    source: string,
    offset: number,
    mainCallback?: ProgressCallback,
  ): ProgressCallback {
    return (current: number, total: number, message: string) => {
      const adjustedProgress = offset + (current / total) * 50;
      mainCallback?.(adjustedProgress, 100, `${source}: ${message}`);
    };
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
