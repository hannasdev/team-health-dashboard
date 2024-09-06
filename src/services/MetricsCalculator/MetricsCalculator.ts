// src/services/metrics/MetricCalculator.ts
import { injectable } from 'inversify';

import type {
  IMetric,
  IMetricCalculator,
  IPullRequest,
} from '../../interfaces/index.js';

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
export class MetricCalculator implements IMetricCalculator {
  /**
   * Calculates all metrics for the given pull requests.
   *
   * @param {IPullRequest[]} pullRequests - An array of pull requests to calculate metrics for.
   * @returns {IMetric[]} An array of calculated metrics.
   */
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[] {
    return [
      this.calculatePRCount(pullRequests),
      this.calculatePRCycleTime(pullRequests),
      this.calculatePRSize(pullRequests),
    ];
  }

  private calculatePRCount(pullRequests: IPullRequest[]): IMetric {
    return {
      id: 'github-pr-count',
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
   * @returns {IMetric} The PR cycle time metric.
   */
  private calculatePRCycleTime(pullRequests: IPullRequest[]): IMetric {
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
      id: 'github-pr-cycle-time',
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
   * @returns {IMetric} The PR size metric.
   */
  private calculatePRSize(pullRequests: IPullRequest[]): IMetric {
    const totalSize = pullRequests.reduce(
      (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
      0,
    );
    const averageSize =
      pullRequests.length > 0 ? totalSize / pullRequests.length : 0;

    return {
      id: 'github-avg-pr-size',
      metric_category: 'GitHub',
      metric_name: 'Average PR Size',
      value: Math.round(averageSize),
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }
}