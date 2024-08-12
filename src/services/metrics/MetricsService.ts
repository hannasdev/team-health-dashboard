// src/services/MetricsService.ts
import { injectable, inject } from 'inversify';

import type {
  IMetricsService,
  IMetric,
  IGoogleSheetsRepository,
  IGitHubRepository,
  IPullRequest,
  ILogger,
} from '../../interfaces/index.js';
import { ProgressCallback } from '../../types/index.js';
import { TYPES } from '../../utils/types.js';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GoogleSheetsRepository)
    private googleSheetsRepository: IGoogleSheetsRepository,
    @inject(TYPES.GitHubRepository) private gitHubRepository: IGitHubRepository,
    @inject(TYPES.Logger) private logger: ILogger,
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

    try {
      const googleSheetsData = await this.googleSheetsRepository.fetchMetrics(
        this.createProgressCallback('Google Sheets', 0, progressCallback),
      );
      allMetrics = [...allMetrics, ...googleSheetsData];
    } catch (error) {
      this.logger.error('Error fetching Google Sheets data:', error as Error);
      errors.push({
        source: 'Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const githubData = await this.gitHubRepository.fetchPullRequests(
        timePeriod,
        this.createProgressCallback('GitHub', 50, progressCallback),
      );
      allMetrics = [
        ...allMetrics,
        ...this.convertPullRequestsToMetrics(githubData.pullRequests),
      ];
      githubStats = {
        totalPRs: githubData.totalPRs,
        fetchedPRs: githubData.fetchedPRs,
        timePeriod: githubData.timePeriod,
      };
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

  private convertPullRequestsToMetrics(
    pullRequests: IPullRequest[],
  ): IMetric[] {
    const metrics: IMetric[] = [];

    // PR Count Metric
    metrics.push({
      id: 'github-pr-count',
      metric_category: 'GitHub',
      metric_name: 'Pull Request Count',
      value: pullRequests.length,
      timestamp: new Date(),
      unit: 'count',
      additional_info: '',
      source: 'GitHub',
    });

    // Average PR Size Metric
    const totalChanges = pullRequests.reduce(
      (sum, pr) => sum + pr.additions + pr.deletions,
      0,
    );
    const avgPRSize =
      pullRequests.length > 0 ? totalChanges / pullRequests.length : 0;

    metrics.push({
      id: 'github-avg-pr-size',
      metric_category: 'GitHub',
      metric_name: 'Average PR Size',
      value: avgPRSize,
      timestamp: new Date(),
      unit: 'lines',
      additional_info: '',
      source: 'GitHub',
    });

    // Average Time to Merge Metric
    const mergedPRs = pullRequests.filter(pr => pr.mergedAt);
    const totalMergeTime = mergedPRs.reduce((sum, pr) => {
      const createDate = new Date(pr.createdAt);
      const mergeDate = new Date(pr.mergedAt!);
      return sum + (mergeDate.getTime() - createDate.getTime());
    }, 0);
    const avgMergeTime =
      mergedPRs.length > 0
        ? totalMergeTime / mergedPRs.length / (1000 * 60 * 60)
        : 0; // in hours
    metrics.push({
      id: 'github-avg-merge-time',
      metric_category: 'GitHub',
      metric_name: 'Average Time to Merge',
      value: avgMergeTime,
      timestamp: new Date(),
      unit: 'hours',
      additional_info: '',
      source: 'GitHub',
    });

    return metrics;
  }
}
