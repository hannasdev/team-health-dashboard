// GitHubDataSource.ts
import { injectable, inject } from 'inversify';

import {
  IGitHubClient,
  ICacheService,
  IConfig,
  IFetchDataResult,
  IPullRequest,
  IMetricCalculator,
  IError,
} from '@/interfaces';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

import { BaseDataSource } from '../base/BaseDataSource';

@injectable()
export class GitHubDataSource extends BaseDataSource {
  private readonly MAX_PAGES = 100;
  private owner: string;
  private repo: string;

  constructor(
    @inject(TYPES.GitHubClient) private githubClient: IGitHubClient,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
    @inject(TYPES.Config) config: IConfig,
  ) {
    super(logger, cacheService, config);
    this.owner = this.config.GITHUB_OWNER;
    this.repo = this.config.GITHUB_REPO;
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  protected getCacheKey(params?: Record<string, any>): string {
    const timePeriod = params?.timePeriod || 90;
    return `github-${this.owner}-${this.repo}-${timePeriod}`;
  }

  async fetchData(
    progressCallback?: ProgressCallback,
    params?: Record<string, any>,
  ): Promise<IFetchDataResult> {
    const timePeriod = params?.timePeriod || 90;
    return this.getDataWithCache(
      { timePeriod },
      () => this.fetchGitHubData(progressCallback, timePeriod),
      3600, // 1 hour cache
    );
  }

  private async fetchGitHubData(
    progressCallback?: ProgressCallback,
    timePeriod: number = 90,
  ): Promise<IFetchDataResult> {
    try {
      progressCallback?.(0, 100, 'Fetching pull requests');
      const pullRequests = await this.fetchAllPullRequests(
        timePeriod,
        progressCallback,
      );
      progressCallback?.(50, 100, 'Calculating metrics');
      const metrics = this.metricCalculator.calculateMetrics(pullRequests);
      progressCallback?.(100, 100, 'Finished processing');

      return {
        metrics,
        errors: [],
        stats: {
          totalPRs: pullRequests.length,
          fetchedPRs: pullRequests.length,
          timePeriod,
        },
      };
    } catch (error) {
      const githubError = this.handleError(error, 'GitHub');
      return {
        metrics: [],
        errors: [githubError],
        stats: {
          totalPRs: 0,
          fetchedPRs: 0,
          timePeriod,
        },
      };
    }
  }

  private async fetchAllPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    let allPullRequests: IPullRequest[] = [];
    let page = 1;

    while (page <= this.MAX_PAGES) {
      const fetchedPRs = await this.githubClient.fetchPullRequests(
        this.owner,
        this.repo,
        timePeriod,
        page,
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
      allPullRequests = [...allPullRequests, ...fetchedPRs];
      page++;

      if (this.isDataComplete(fetchedPRs, timePeriod)) break;
    }

    return allPullRequests;
  }

  private trackPageProgress(
    page: number,
    current: number,
    total: number,
    message: string,
    progressCallback?: ProgressCallback,
  ): void {
    const overallCurrent = (page - 1) * 100 + current;
    const overallTotal = this.MAX_PAGES * 100;
    progressCallback?.(overallCurrent, overallTotal, message);
  }

  private isDataComplete(
    pullRequests: IPullRequest[],
    timePeriod: number,
  ): boolean {
    if (pullRequests.length === 0) return true;
    const oldestPRDate = new Date(
      pullRequests[pullRequests.length - 1].created_at,
    );
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timePeriod);
    return oldestPRDate < cutoffDate;
  }
}
