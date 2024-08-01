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
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IMetric[]> {
    const cacheKey = this.getCacheKey(startDate, endDate);
    const cachedData = this.cacheService.get<IMetric[]>(cacheKey);
    if (cachedData) {
      this.logger.info('Returning cached GitHub data');
      progressCallback?.(100, 'Retrieved cached GitHub data', { cached: true });
      return cachedData;
    }

    try {
      progressCallback?.(0, 'Starting to fetch GitHub data');
      this.logger.info(`Fetching GitHub data for ${this.owner}/${this.repo}`);

      const pullRequests = await this.streamPullRequests(
        progressCallback,
        startDate,
        endDate,
      );

      this.logger.info(`Processed ${pullRequests.length} pull requests`);
      progressCallback?.(80, `Processed ${pullRequests.length} pull requests`, {
        totalPullRequests: pullRequests.length,
      });

      const prCycleTime = this.calculateAveragePRCycleTime(pullRequests);
      const prSize = this.calculateAveragePRSize(pullRequests);

      const metrics: IMetric[] = [
        {
          id: 'github-pr-cycle-time',
          name: 'PR Cycle Time',
          value: prCycleTime,
          timestamp: new Date(),
          source: 'GitHub',
        },
        {
          id: 'github-pr-size',
          name: 'PR Size',
          value: prSize,
          timestamp: new Date(),
          source: 'GitHub',
        },
      ];

      this.cacheService.set(cacheKey, metrics);
      progressCallback?.(100, 'Finished processing GitHub data', {
        totalPullRequests: pullRequests.length,
      });
      return metrics;
    } catch (error) {
      this.logger.error('Error fetching data from GitHub:', error as Error);
      progressCallback?.(100, 'Error fetching data from GitHub', {
        error: true,
      });
      throw new Error(`Failed to fetch data from GitHub: ${error}`);
    }
  }

  private async *pullRequestGenerator(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startDate?: Date,
    endDate?: Date,
  ) {
    const params: any = {
      owner: this.owner,
      repo: this.repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    };

    if (startDate) {
      params.since = startDate.toISOString();
    }

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
        if (endDate && new Date(pr.updated_at) > endDate) {
          continue;
        }
        yield pr;
      }
      if (
        endDate &&
        new Date(response.data[response.data.length - 1].updated_at) < endDate
      ) {
        break;
      }
    }
  }

  private async streamPullRequests(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const pullRequests: any[] = [];
    for await (const pr of this.pullRequestGenerator(
      progressCallback,
      startDate,
      endDate,
    )) {
      pullRequests.push(pr);
    }
    return pullRequests;
  }

  private getCacheKey(startDate?: Date, endDate?: Date): string {
    return `github-${this.owner}/${this.repo}-${
      startDate?.toISOString() || 'all'
    }-${endDate?.toISOString() || 'all'}`;
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

    const average = totalHours / mergedPRs.length;

    return Math.round(average);
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
