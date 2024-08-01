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
    const cachedData = this.cacheService.get<IMetric[]>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      progressCallback?.(0, 'Starting to fetch GitHub data');

      const pullRequests = await this.streamPullRequests(progressCallback);
      progressCallback?.(50, 'Fetched pull requests');

      // TODO: For simplicity, we're not implementing separate fetches for issues and workflows
      // You would need to implement similar streaming methods for these

      const metrics: IMetric[] = [
        this.calculatePRCycleTime(pullRequests),
        this.calculatePRSize(pullRequests),
        // TODO: Add other metric calculations here
      ];

      this.cacheService.set(cacheKey, metrics);
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
  ) {
    const params = {
      owner: this.owner,
      repo: this.repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    };

    let pageCount = 0;
    let totalPullRequests = 0;
    for await (const response of this.client.paginate(
      'GET /repos/{owner}/{repo}/pulls',
      params,
    )) {
      pageCount++;
      totalPullRequests += response.data.length;
      progressCallback?.(
        20 + pageCount * 5,
        `Fetching page ${pageCount} of pull requests`,
        { currentPage: pageCount, totalPullRequests },
      );
      for (const pr of response.data) {
        yield pr;
      }
    }
  }

  private async streamPullRequests(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
  ): Promise<any[]> {
    const pullRequests: any[] = [];
    for await (const pr of this.pullRequestGenerator(progressCallback)) {
      pullRequests.push(pr);
    }
    return pullRequests;
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

    const totalSize = pullRequests.reduce(
      (sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0),
      0,
    );
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
