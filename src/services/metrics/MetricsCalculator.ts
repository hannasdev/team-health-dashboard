// src/services/metrics/MetricCalculator.ts
import { injectable } from 'inversify';

import type {
  IMetric,
  IMetricCalculator,
  IPullRequest,
} from '@/interfaces/index';

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
      this.calculatePRCycleTime(pullRequests),
      this.calculatePRSize(pullRequests),
    ];
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
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);
    const averageCycleTime =
      mergedPRs.length > 0
        ? mergedPRs.reduce((sum, pr) => {
            const createdAt = new Date(pr.created_at);
            const mergedAt = new Date(pr.merged_at!);
            return (
              sum +
              (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
            );
          }, 0) / mergedPRs.length
        : 0;

    return {
      id: 'github-pr-cycle-time',
      metric_category: 'Efficiency',
      metric_name: 'PR Cycle Time',
      value: Math.round(averageCycleTime),
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
    const averageSize =
      pullRequests.length > 0
        ? pullRequests.reduce(
            (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
            0,
          ) / pullRequests.length
        : 0;

    return {
      id: 'github-pr-size',
      metric_category: 'Code Quality',
      metric_name: 'PR Size',
      value: Math.round(averageSize),
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }
}