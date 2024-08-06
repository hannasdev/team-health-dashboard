// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';

import type {
  IMetricCalculator,
  IGitHubRepository,
  IProgressTracker,
  IFetchDataResult,
  IGitHubService,
  IPullRequest,
  IMetric,
} from '@/interfaces';
import type { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

/**
 * GitHubService
 *
 * This service orchestrates the fetching of GitHub data and calculation of metrics.
 * It uses the GitHubRepository to fetch data, the MetricCalculator to compute metrics,
 * and the ProgressTracker to report progress.
 *
 * @implements {IGitHubService}
 */
@injectable()
export class GitHubService implements IGitHubService {
  private readonly MAX_PAGES = 100;

  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.MetricCalculator)
    private metricCalculator: IMetricCalculator,
    @inject(TYPES.ProgressTracker) private progressTracker: IProgressTracker,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  async fetchData(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<IFetchDataResult> {
    try {
      const pullRequestsData = await this.fetchAllPullRequests(
        timePeriod,
        (current, total, message) => {
          // Directly use the progress tracker and callback
          this.progressTracker.trackProgress(current, total, message);
          progressCallback?.(current, total, message);
        },
      );
      const metrics = this.calculateMetrics(pullRequestsData.pullRequests);

      return {
        metrics,
        totalPRs: pullRequestsData.totalPRs,
        fetchedPRs: pullRequestsData.fetchedPRs,
        timePeriod: pullRequestsData.timePeriod,
      };
    } catch (error) {
      this.handleFetchError(error);
    }
  }

  private async fetchAllPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback, // Make this parameter optional
  ): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }> {
    return this.repository.fetchPullRequests(
      timePeriod,
      progressCallback ? progressCallback : undefined,
    );
  }

  /**
   * Calculates metrics for the given pull requests.
   *
   * @private
   * @param {IPullRequest[]} pullRequests - The pull requests to calculate metrics for.
   * @returns {IMetric[]} Array of calculated metrics.
   */
  private calculateMetrics(pullRequests: IPullRequest[]): IMetric[] {
    this.logger.info(
      `Calculating metrics for ${pullRequests.length} pull requests`,
    );
    return this.metricCalculator.calculateMetrics(pullRequests);
  }

  /**
   * Handles errors that occur during data fetching.
   *
   * @private
   * @param {unknown} error - The error that occurred.
   * @throws {Error} Always throws an error with a formatted message.
   */
  private handleFetchError(error: unknown): never {
    this.logger.error(
      'Error fetching GitHub data:',
      error instanceof Error ? error : undefined,
    );
    throw new Error(
      `Failed to fetch GitHub data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
