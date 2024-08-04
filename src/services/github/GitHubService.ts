// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../utils/types';
import type {
  IMetricCalculator,
  IGitHubRepository,
  IProgressTracker,
  IFetchDataResult,
  IGitHubService,
  IPullRequest,
  IMetric,
} from '../../interfaces/index';
import type { ProgressCallback } from '../../types';
import { Logger } from '../../utils/logger';

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
  /**
   * Creates an instance of GitHubService.
   *
   * @param {IGitHubRepository} repository - The repository for fetching GitHub data.
   * @param {IMetricCalculator} metricCalculator - The calculator for computing metrics.
   * @param {IProgressTracker} progressTracker - The tracker for reporting progress.
   * @param {Logger} logger - The logger for recording operations and errors.
   */
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
    @inject(TYPES.ProgressTracker) private progressTracker: IProgressTracker,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  /**
   * Fetches GitHub data and calculates metrics.
   *
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   * @param {number} [timePeriod=90] - Time period in days for which to fetch data.
   * @returns {Promise<IFetchDataResult>} The fetched data and calculated metrics.
   * @throws {Error} If data fetching fails.
   */
  async fetchData(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<IFetchDataResult> {
    this.progressTracker.setReportInterval(1000); // Set report interval to 1 second

    if (progressCallback) {
      this.progressTracker.trackProgress = progressCallback;
    }

    try {
      const pullRequests = await this.repository.fetchPullRequests(timePeriod);

      this.progressTracker.trackProgress(50, 100, 'Fetched pull requests');

      const metrics = this.metricCalculator.calculateMetrics(pullRequests);

      this.progressTracker.trackProgress(100, 100, 'Calculated metrics');

      return {
        metrics,
        totalPRs: pullRequests.length,
        fetchedPRs: pullRequests.length,
        timePeriod,
      };
    } catch (error) {
      this.logger.error('Error fetching GitHub data:', error as Error);
      throw error;
    }
  }

  /**
   * Fetches all pull requests for the given time period.
   *
   * @private
   * @param {number} timePeriod - Time period in days for which to fetch data.
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   * @returns {Promise<IPullRequest[]>} Array of fetched pull requests.
   */
  private async fetchAllPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    const allPullRequests: IPullRequest[] = [];
    let page = 1;

    while (page <= this.MAX_PAGES) {
      const fetchedPRs = await this.repository.fetchPullRequests(
        timePeriod,
        (current, total, message) => {
          this.trackPageProgress(
            page,
            current,
            total,
            message,
            progressCallback,
          );
        },
      );

      if (!fetchedPRs || fetchedPRs.length === 0) break;
      allPullRequests.push(...fetchedPRs);
      page++;
    }

    return allPullRequests;
  }

  // /**
  //  * Fetches a single page of pull requests.
  //  *
  //  * @private
  //  * @param {number} page - The page number to fetch.
  //  * @param {number} timePeriod - Time period in days for which to fetch data.
  //  * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
  //  * @returns {Promise<IPullRequest[]>} Array of fetched pull requests for the page.
  //  */
  // private async fetchPageOfPullRequests(
  //   page: number,
  //   timePeriod: number,
  //   progressCallback?: ProgressCallback,
  // ): Promise<IPullRequest[]> {
  //   this.logger.info(`Fetching page ${page}`);
  //   return this.repository.fetchPullRequests(timePeriod, (current, total) =>
  //     this.trackPageProgress(page, current, total, progressCallback),
  //   );
  // }

  /**
   * Tracks progress for a single page of pull requests.
   *
   * @private
   * @param {number} page - The current page number.
   * @param {number} current - The current progress within the page.
   * @param {number} total - The total items in the page.
   * @param {ProgressCallback} [progressCallback] - Optional callback for tracking progress.
   */
  private trackPageProgress(
    page: number,
    current: number,
    total: number,
    message: string,
    progressCallback?: ProgressCallback,
  ): void {
    const overallCurrent = (page - 1) * 100 + current;
    const overallTotal = page * 100;

    this.progressTracker.trackProgress(overallCurrent, overallTotal, message);
    progressCallback?.(overallCurrent, overallTotal, message);
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

  private createFetchDataResult(
    pullRequests: IPullRequest[],
    metrics: IMetric[],
    timePeriod: number,
  ): IFetchDataResult {
    return {
      metrics,
      totalPRs: pullRequests.length,
      fetchedPRs: pullRequests.length,
      timePeriod,
    };
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
