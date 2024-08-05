import { injectable } from 'inversify';

import { IPullRequest, IMetric } from '@/interfaces';
import { BaseMetricCalculator } from '@/services/base/BaseMetricCalculator';
/**
 * GitHubMetricCalculator
 *
 * This class is responsible for calculating various metrics based on GitHub pull request data.
 * It extends the BaseMetricCalculator and provides GitHub-specific implementations.
 *
 * @extends {BaseMetricCalculator}
 */
@injectable()
export class GitHubMetricCalculator extends BaseMetricCalculator {
  /**
   * Calculates all metrics for the given GitHub pull requests.
   *
   * @param {IPullRequest[]} pullRequests - An array of GitHub pull requests to calculate metrics for.
   * @returns {IMetric[]} An array of calculated metrics.
   */
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[] {
    return [
      this.calculatePRCycleTime(pullRequests),
      this.calculatePRSize(pullRequests),
      // Add more GitHub-specific metrics here if needed
    ];
  }

  /**
   * Gets the name of the data source.
   *
   * @protected
   * @returns {string} The name of the data source (GitHub).
   */
  protected getSourceName(): string {
    return 'GitHub';
  }

  // Add any GitHub-specific metric calculations here
}
