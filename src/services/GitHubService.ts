// src/services/GitHubService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import { Octokit } from '@octokit/rest';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGitHubClient } from '../interfaces/IGitHubClient';
import type { IGitHubService } from '../interfaces/IGitHubService';
import type { IConfig } from '../interfaces/IConfig';
import type { ICacheService } from '../interfaces/ICacheService';
import { Logger } from '../utils/logger';

@injectable()
export class GitHubService implements IGitHubService {
  private owner: string;
  private repo: string;
  private timeout: number = 300000; // 5 minutes timeout

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CacheService) private cacheService: ICacheService,
  ) {
    this.owner = this.configService.GITHUB_OWNER;
    this.repo = this.configService.GITHUB_REPO;
    if (!this.owner || !this.repo) {
      this.logger.error('GitHub owner or repo is not set correctly');
    }
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  async fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]> {
    const cacheKey = this.getCacheKey();
    const cachedData = this.cacheService.get<{
      metrics: IMetric[];
      lastProcessedPage: number;
      lastProcessedPR: number;
    }>(cacheKey);

    let metrics: IMetric[] = [];
    let lastProcessedPage = 0;
    let lastProcessedPR = 0;

    if (cachedData) {
      metrics = cachedData.metrics;
      lastProcessedPage = cachedData.lastProcessedPage;
      lastProcessedPR = cachedData.lastProcessedPR;
      progressCallback?.(50, `Resuming from page ${lastProcessedPage + 1}`);
    } else {
      progressCallback?.(0, 'Starting to fetch GitHub data');
    }

    try {
      const pullRequests = await this.streamPullRequests(
        progressCallback,
        lastProcessedPage,
        lastProcessedPR,
      );
      this.logger.info(`Fetched ${pullRequests.length} pull requests`);
      progressCallback?.(75, `Fetched ${pullRequests.length} pull requests`);

      metrics = [
        ...metrics,
        this.calculatePRCycleTime(pullRequests),
        this.calculatePRSize(pullRequests),
      ];

      this.cacheService.set(cacheKey, {
        metrics,
        lastProcessedPage,
        lastProcessedPR,
      });
      progressCallback?.(100, 'Finished processing GitHub data');

      return metrics;
    } catch (error) {
      this.logger.error('Error fetching data from GitHub:', error as Error);
      throw new Error(
        `Failed to fetch data from GitHub: ${(error as Error).message}`,
      );
    }
  }

  private async *pullRequestGenerator(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startPage: number = 0,
    startPR: number = 0,
  ) {
    const params = {
      owner: this.owner,
      repo: this.repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      page: startPage + 1,
    };

    let pageCount = startPage;
    let totalPullRequests = startPR;
    const startTime = Date.now();

    try {
      for await (const response of this.client.paginate(
        'GET /repos/{owner}/{repo}/pulls',
        params,
      )) {
        pageCount++;
        totalPullRequests += response.data.length;
        this.logger.info(
          `Fetched page ${pageCount} with ${response.data.length} PRs. Total: ${totalPullRequests}`,
        );
        progressCallback?.(
          40 + pageCount * 2,
          `Fetching page ${pageCount} of pull requests. Total: ${totalPullRequests}`,
          { currentPage: pageCount, totalPullRequests },
        );

        for (const pr of response.data) {
          if (Date.now() - startTime > this.timeout) {
            this.logger.warn('Operation timed out, saving progress');
            return;
          }

          try {
            const detailedPR = await this.fetchDetailedPR(pr.number);
            yield detailedPR;
          } catch (error) {
            this.logger.error(
              `Error fetching detailed PR #${pr.number}: ${error}`,
            );
          }
        }

        // Save progress after each page
        this.saveProgress(pageCount, totalPullRequests);
      }
    } catch (error) {
      this.logger.error(`Error in pullRequestGenerator: ${error}`);
      throw error;
    }
  }

  private async fetchDetailedPR(pullNumber: number): Promise<any> {
    try {
      for await (const response of this.client.paginate(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner: this.owner,
          repo: this.repo,
          pull_number: pullNumber,
        },
      )) {
        return response.data;
      }
      throw new Error(`No data found for PR #${pullNumber}`);
    } catch (error) {
      this.logger.error(`Error fetching detailed PR #${pullNumber}: ${error}`);
      throw error;
    }
  }

  private async streamPullRequests(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startPage: number = 0,
    startPR: number = 0,
  ): Promise<any[]> {
    const pullRequests: any[] = [];
    try {
      for await (const pr of this.pullRequestGenerator(
        progressCallback,
        startPage,
        startPR,
      )) {
        pullRequests.push(pr);
        if (pullRequests.length % 100 === 0) {
          this.logger.info(`Processed ${pullRequests.length} pull requests`);
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
    lastProcessedPR: number,
  ): void {
    const cacheKey = this.getProgressCacheKey();
    this.cacheService.set(cacheKey, { lastProcessedPage, lastProcessedPR });
  }

  private getProgressCacheKey(): string {
    return `github-${this.owner}/${this.repo}-progress`;
  }

  private getCacheKey(): string {
    return `github-${this.owner}/${this.repo}-all-all`;
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
}

@injectable()
export class OctokitAdapter implements IGitHubClient {
  private octokit: Octokit;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.octokit = new Octokit({ auth: config.GITHUB_TOKEN });
  }

  async *paginate(
    route: string,
    params: any,
  ): AsyncGenerator<any, void, unknown> {
    for await (const response of this.octokit.paginate.iterator(
      route,
      params,
    )) {
      yield response;
    }
  }
}
