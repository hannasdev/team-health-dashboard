// src/services/GitHubService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import { BaseService } from './BaseService';
import type {
  IGitHubClient,
  IGitHubService,
  IConfig,
  ICacheService,
  IMetric,
} from '../interfaces/index';
import { Logger } from '../utils/logger';

/**
 * GitHubService
 *
 * This service is responsible for fetching and processing data from GitHub
 * as part of the Team Health Dashboard. It extends the BaseService to leverage
 * common functionality such as caching and logging.
 *
 * The service fetches pull request data from a specified GitHub repository,
 * calculates metrics such as PR cycle time and size, and caches the results
 * for improved performance. It supports progress tracking and handles data
 * fetching in chunks to manage large datasets efficiently.
 *
 * Key features:
 * - Fetches PR data using GitHub's API
 * - Calculates PR cycle time and size metrics
 * - Implements caching for performance optimization
 * - Supports progress tracking through callback mechanism
 * - Handles timeouts and interruptions gracefully
 *
 * @extends BaseService
 * @implements IGitHubService
 */
@injectable()
export class GitHubService extends BaseService implements IGitHubService {
  private owner: string;
  private repo: string;
  private timeout: number = 300000; // 5 minutes timeout
  private startTime: number;

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(logger, cacheService);
    this.owner = this.configService.GITHUB_OWNER;
    this.repo = this.configService.GITHUB_REPO;
    if (!this.owner || !this.repo) {
      this.logger.error('GitHub owner or repo is not set correctly');
    }
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
    this.startTime = Date.now();
  }

  protected getCacheKey(timePeriod: number): string {
    return `github-${this.owner}/${this.repo}-all-${timePeriod}`;
  }

  async fetchData(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    timePeriod: number = 90,
  ): Promise<{
    metrics: IMetric[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }> {
    const cacheKey = this.getCacheKey(timePeriod);
    return this.getDataWithCache(
      cacheKey,
      () => this.fetchGitHubData(progressCallback, timePeriod),
      3600, // 1 hour cache
    );
  }

  private async fetchGitHubData(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    timePeriod: number = 90,
  ): Promise<{
    metrics: IMetric[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }> {
    const cachedData = this.cacheService.get<{
      metrics: IMetric[];
      lastProcessedPage: number;
      lastProcessedPR: number;
      totalPRs: number;
      fetchedPRs: number;
    }>(this.getProgressCacheKey(timePeriod));

    let metrics: IMetric[] = [];
    let lastProcessedPage = 0;
    let lastProcessedPR = 0;
    let totalPRs = 0;
    let fetchedPRs = 0;

    if (cachedData) {
      metrics = cachedData.metrics;
      lastProcessedPage = cachedData.lastProcessedPage;
      lastProcessedPR = cachedData.lastProcessedPR;
      totalPRs = cachedData.totalPRs;
      fetchedPRs = cachedData.fetchedPRs;

      if (fetchedPRs === totalPRs) {
        progressCallback?.(
          100,
          `Using cached data. All ${totalPRs} PRs have been fetched.`,
        );
        return { metrics, totalPRs, fetchedPRs, timePeriod };
      }

      progressCallback?.(
        50,
        `Resuming from page ${
          lastProcessedPage + 1
        }. Total PRs: ${totalPRs}, Fetched: ${fetchedPRs}`,
      );
    } else {
      progressCallback?.(0, 'Starting to fetch GitHub data');
      totalPRs = await this.getTotalPRCount(timePeriod);
      progressCallback?.(10, `Total PRs to fetch: ${totalPRs}`);
    }

    this.startTime = Date.now(); // Add this line

    try {
      const pullRequests = await this.streamPullRequests(
        progressCallback,
        lastProcessedPage,
        lastProcessedPR,
        timePeriod,
        totalPRs,
      );
      fetchedPRs += pullRequests.length;
      this.logger.info(
        `Fetched ${fetchedPRs} out of ${totalPRs} pull requests`,
      );
      progressCallback?.(
        75,
        `Fetched ${fetchedPRs} out of ${totalPRs} pull requests`,
      );

      metrics = [
        ...metrics,
        this.calculatePRCycleTime(pullRequests),
        this.calculatePRSize(pullRequests),
      ];

      this.cacheService.set(this.getProgressCacheKey(timePeriod), {
        metrics,
        lastProcessedPage,
        lastProcessedPR: fetchedPRs,
        totalPRs,
        fetchedPRs,
      });
      progressCallback?.(100, 'Finished processing GitHub data');

      return { metrics, totalPRs, fetchedPRs, timePeriod };
    } catch (error) {
      this.logger.error('Error fetching data from GitHub:', error as Error);
      throw new Error(
        `Failed to fetch data from GitHub: ${(error as Error).message}`,
      );
    }
  }

  private async *pullRequestGenerator(
    progressCallback:
      | ((progress: number, message: string, details?: any) => void)
      | undefined,
    startPage: number,
    startPR: number,
    timePeriod: number,
    totalPRs: number,
  ) {
    const { since, until } = this.getDateRange(timePeriod);
    const params = {
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
      page: startPage + 1,
    };

    let pageCount = startPage;
    let processedPRs = startPR;
    const startTime = Date.now();

    try {
      for await (const response of this.client.paginate.iterator(
        'GET /repos/{owner}/{repo}/pulls',
        params,
      )) {
        pageCount++;
        let validPRsInPage = 0;
        let collectedPRs = [];

        for (const pr of response.data) {
          if (Date.now() - startTime > this.timeout) {
            this.logger.warn('Operation timed out, saving progress');
            yield* collectedPRs;
            return;
          }

          const createdAt = new Date(pr.created_at);
          if (createdAt >= new Date(since) && createdAt <= new Date(until)) {
            validPRsInPage++;
            processedPRs++;

            try {
              const detailedPR = await this.fetchDetailedPR(pr.number);
              collectedPRs.push(detailedPR);
            } catch (error) {
              this.logger.error(
                `Error fetching detailed PR #${pr.number}: ${error}`,
              );
            }

            // Update progress after each PR
            const progress = Math.min(
              (processedPRs / Math.max(totalPRs, processedPRs)) * 100,
              100,
            );
            progressCallback?.(
              progress,
              `Fetching page ${pageCount} of pull requests. Progress: ${processedPRs}/${Math.max(
                totalPRs,
                processedPRs,
              )}`,
              {
                currentPage: pageCount,
                processedPRs,
                totalPRs: Math.max(totalPRs, processedPRs),
              },
            );
          } else if (createdAt < new Date(since)) {
            // If we've gone past our date range, we can stop paginating
            this.logger.info(
              'Reached PRs older than the specified time period',
            );
            yield* collectedPRs;
            return;
          }
        }

        // Yield collected PRs for this page
        yield* collectedPRs;

        this.logger.info(
          `Fetched page ${pageCount} with ${validPRsInPage} valid PRs. Total: ${processedPRs}/${Math.max(
            totalPRs,
            processedPRs,
          )}`,
        );

        // If no valid PRs in this page, we've likely reached the end of our date range
        if (validPRsInPage === 0) {
          this.logger.info('No more PRs within the specified time period');
          return;
        }

        // Save progress after each page
        this.saveProgress(
          pageCount,
          processedPRs,
          Math.max(totalPRs, processedPRs),
          timePeriod,
        );
      }
    } catch (error) {
      this.logger.error(`Error in pullRequestGenerator: ${error}`);
      throw error;
    }
  }

  private async fetchDetailedPR(pullNumber: number): Promise<any> {
    const response = await this.client.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}',
      {
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
      },
    );
    return response.data;
  }

  private async streamPullRequests(
    progressCallback:
      | ((progress: number, message: string, details?: any) => void)
      | undefined,
    startPage: number,
    startPR: number,
    timePeriod: number,
    initialTotalPRs: number,
  ): Promise<any[]> {
    const pullRequests: any[] = [];
    let actualTotalPRs = initialTotalPRs;
    let processedPRs = startPR;

    try {
      for await (const pr of this.pullRequestGenerator(
        progressCallback,
        startPage,
        processedPRs,
        timePeriod,
        actualTotalPRs,
      )) {
        pullRequests.push(pr);
        processedPRs++;

        // Update actual total if we've exceeded the initial estimate
        if (processedPRs > actualTotalPRs) {
          actualTotalPRs = processedPRs;
        }

        const progress = Math.min(
          (processedPRs / Math.max(actualTotalPRs, processedPRs)) * 100,
          100,
        );

        if (
          pullRequests.length % 100 === 0 ||
          pullRequests.length === actualTotalPRs
        ) {
          this.logger.info(
            `Processed ${processedPRs}/${actualTotalPRs} pull requests`,
          );
          progressCallback?.(
            progress,
            `Fetched ${processedPRs} out of ${actualTotalPRs} pull requests`,
          );
        }

        // Check for timeout
        if (Date.now() - this.startTime > this.timeout) {
          this.logger.warn('Operation timed out, returning collected PRs');
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Error in streamPullRequests: ${error}`);
      throw error;
    }

    return pullRequests;
  }

  private saveProgress(
    lastProcessedPage: number,
    processedPRs: number,
    totalPRs: number,
    timePeriod: number,
  ): void {
    const cacheKey = this.getProgressCacheKey(timePeriod);
    this.cacheService.set(cacheKey, {
      lastProcessedPage,
      processedPRs,
      totalPRs,
    });
  }

  private getProgressCacheKey(timePeriod: number): string {
    return `github-${this.owner}/${this.repo}-progress-${timePeriod}`;
  }

  private calculatePRCycleTime(pullRequests: any[]): IMetric {
    const averageCycleTime = this.calculateAveragePRCycleTime(pullRequests);
    return {
      id: 'github-pr-cycle-time',
      metric_category: 'Efficiency',
      metric_name: 'PR Cycle Time',
      value: averageCycleTime,
      timestamp: new Date(),
      unit: 'hours',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }

  private calculatePRSize(pullRequests: any[]): IMetric {
    const averageSize = this.calculateAveragePRSize(pullRequests);
    return {
      id: 'github-pr-size',
      metric_category: 'Code Quality',
      metric_name: 'PR Size',
      value: averageSize,
      timestamp: new Date(),
      unit: 'lines',
      additional_info: `Based on ${pullRequests.length} PRs`,
      source: 'GitHub',
    };
  }

  private calculateAveragePRCycleTime(pullRequests: any[]): number {
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);
    if (mergedPRs.length === 0) return 0;

    const totalHours = mergedPRs.reduce((sum, pr) => {
      const createdAt = new Date(pr.created_at);
      const mergedAt = new Date(pr.merged_at);
      const diffInHours =
        (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return sum + diffInHours;
    }, 0);

    return Math.round(totalHours / mergedPRs.length);
  }

  private calculateAveragePRSize(pullRequests: any[]): number {
    if (pullRequests.length === 0) return 0;

    const totalSize = pullRequests.reduce((sum, pr) => {
      const additions = pr.additions || 0;
      const deletions = pr.deletions || 0;
      this.logger.info(
        `PR #${pr.number}: additions=${additions}, deletions=${deletions}`,
      );
      return sum + additions + deletions;
    }, 0);

    return Math.round(totalSize / pullRequests.length);
  }

  private async getTotalPRCount(timePeriod: number): Promise<number> {
    const { since, until } = this.getDateRange(timePeriod);
    const formattedSince = since.split('T')[0];
    const formattedUntil = until.split('T')[0];
    const response = await this.client.request('GET /search/issues', {
      q: `repo:${this.owner}/${this.repo} is:pr created:${formattedSince}..${formattedUntil}`,
      per_page: 1,
    });
    return response.data.total_count || 0;
  }

  private getDateRange(timePeriod: number): { since: string; until: string } {
    const now = new Date();
    const since = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000);
    return {
      since: since.toISOString(),
      until: now.toISOString(),
    };
  }
}
