// BaseMetricCalculator.ts
import { injectable } from 'inversify';

import { IMetric, IPullRequest, IMetricCalculator } from '@/interfaces/index';

/**
 * BaseMetricCalculator
 *
 * This abstract class provides a base implementation for metric calculators.
 * It defines common methods and structures for calculating metrics based on pull request data.
 *
 * @implements {IMetricCalculator}
 */
@injectable()
export abstract class BaseMetricCalculator implements IMetricCalculator {
  /**
   * Calculates all metrics for the given pull requests.
   *
   * @param {IPullRequest[]} pullRequests - An array of pull requests to calculate metrics for.
   * @returns {IMetric[]} An array of calculated metrics.
   */
  abstract calculateMetrics(pullRequests: IPullRequest[]): IMetric[];

  /**
   * Calculates the average cycle time for pull requests.
   * Cycle time is defined as the time between PR creation and merge.
   *
   * @protected
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetric} The PR cycle time metric.
   */
  protected calculatePRCycleTime(pullRequests: IPullRequest[]): IMetric {
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
      id: `${this.getSourceName().toLowerCase()}-pr-cycle-time`,
      metric_category: 'Efficiency',
      metric_name: 'PR Cycle Time',
      value: Math.round(averageCycleTime),
      timestamp: new Date(),
      unit: 'hours',
      additional_info: `Based on ${mergedPRs.length} merged PRs`,
      source: this.getSourceName(),
    };
  }

  /**
   * Calculates the average size of pull requests.
   * Size is defined as the sum of additions and deletions.
   *
   * @protected
   * @param {IPullRequest[]} pullRequests - An array of pull requests.
   * @returns {IMetric} The PR size metric.
   */
  protected calculatePRSize(pullRequests: IPullRequest[]): IMetric {
    const averageSize =
      pullRequests.length > 0
        ? pullRequests.reduce(
            (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
            0,
          ) / pullRequests.length
        : 0;

    return {
      id: `${this.getSourceName().toLowerCase()}-pr-size`,
      metric_category: 'Code Quality',
      metric_name: 'PR Size',
      value: Math.round(averageSize),
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: this.getSourceName(),
    };
  }

  /**
   * Gets the name of the data source.
   *
   * @protected
   * @returns {string} The name of the data source.
   */
  protected abstract getSourceName(): string;
}
