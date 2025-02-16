// src/services/metrics/MetricCalculator.ts
import { injectable } from 'inversify';

import { MetricModel } from '../../data/models/metricModel/index.js';

import type { IMetricsCalculator } from './IMetricsCalculator.js';
import type { IPullRequest } from '../../data/repositories/GitHubRepository/index.js';

/**
 * MetricCalculator
 *
 * This class is responsible for calculating various metrics based on pull request data.
 * It implements the IMetricCalculator interface and provides methods to calculate
 * PR cycle time and PR size metrics.
 *
 * @implements {IMetricCalculator}
 */
@injectable()
export class MetricsCalculator implements IMetricsCalculator {
  public calculateMetrics(data: IPullRequest[] | MetricModel[]): MetricModel[] {
    if (this.isPullRequestArray(data)) {
      return this.calculateGitHubMetrics(data);
    } else {
      return this.calculateGoogleSheetsMetrics(data);
    }
  }

  private calculateGitHubMetrics(pullRequests: IPullRequest[]): MetricModel[] {
    const metrics: MetricModel[] = [];

    metrics.push(this.calculatePRCount(pullRequests));
    metrics.push(this.calculatePRCycleTime(pullRequests));
    metrics.push(this.calculatePRSize(pullRequests));

    return metrics;
  }

  private calculatePRCount(pullRequests: IPullRequest[]): MetricModel {
    return {
      _id: 'github-pr-count',
      metric_category: 'GitHub',
      metric_name: 'Pull Request Count',
      value: pullRequests.length,
      timestamp: new Date(),
      unit: 'count',
      additional_info: '',
      source: 'GitHub',
    };
  }

  /**
   * Calculates the average cycle time for pull requests.
   * Cycle time is defined as the time between PR creation and merge.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetricModel} The PR cycle time metric.
   */
  private calculatePRCycleTime(pullRequests: IPullRequest[]): MetricModel {
    const mergedPRs = pullRequests.filter(pr => pr.mergedAt);

    const averageCycleTime =
      mergedPRs.length > 0
        ? mergedPRs.reduce((sum, pr) => {
            const createdAt = new Date(pr.createdAt);
            const mergedAt = new Date(pr.mergedAt!);
            return sum + (mergedAt.getTime() - createdAt.getTime());
          }, 0) / mergedPRs.length
        : 0;

    const averageCycleTimeInHours = averageCycleTime / (1000 * 60 * 60);

    return {
      _id: 'github-pr-cycle-time',
      metric_category: 'GitHub',
      metric_name: 'Average Time to Merge',
      value: Math.round(averageCycleTimeInHours),
      timestamp: new Date(),
      unit: 'hours',
      additional_info: `Based on ${mergedPRs.length} merged PRs`,
      source: 'GitHub',
    };
  }

  /**
   * Calculates the average size of pull requests.
   * Size is defined as the sum of additions and deletions.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetricModel} The PR size metric.
   */
  private calculatePRSize(pullRequests: IPullRequest[]): MetricModel {
    const totalSize = pullRequests.reduce(
      (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
      0,
    );
    const averageSize =
      pullRequests.length > 0 ? totalSize / pullRequests.length : 0;

    return {
      _id: 'github-avg-pr-size',
      metric_category: 'GitHub',
      metric_name: 'Average PR Size',
      value: Math.round(averageSize),
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }

  private calculateGoogleSheetsMetrics(metrics: MetricModel[]): MetricModel[] {
    // For Google Sheets, we might not need to do any additional calculation
    // as the data is already in the IMetric format. However, you can add any
    // additional processing or validation here if needed.
    return metrics;
  }

  private isPullRequestArray(
    data: IPullRequest[] | MetricModel[],
  ): data is IPullRequest[] {
    return data.length > 0 && 'number' in data[0];
  }
}
