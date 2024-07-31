// src/services/GitHubService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import { Octokit } from '@octokit/rest';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGitHubClient } from '../interfaces/IGitHubClient';
import type { IGitHubService } from '../interfaces/IGitHubService';
import type { IConfig } from '../interfaces/IConfig';
import { Logger } from '../utils/logger';

@injectable()
export class GitHubService implements IGitHubService {
  private owner: string;
  private repo: string;

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
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

  async fetchData(): Promise<IMetric[]> {
    try {
      this.logger.info(`Fetching GitHub data for ${this.owner}/${this.repo}`);
      const pullRequests = await this.client.paginate(
        'GET /repos/{owner}/{repo}/pulls',
        {
          owner: this.owner,
          repo: this.repo,
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        },
      );

      this.logger.info(`Fetched ${pullRequests.length} pull requests`);

      const prCycleTime = this.calculateAveragePRCycleTime(pullRequests);
      const prSize = this.calculateAveragePRSize(pullRequests);

      return [
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
    } catch (error) {
      this.logger.error('Error fetching data from GitHub:', error as Error);
      throw new Error(`Failed to fetch data from GitHub: ${error}`);
    }
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

  async paginate(route: string, params: any): Promise<any[]> {
    return this.octokit.paginate(route, params);
  }
}
