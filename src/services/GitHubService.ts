// src/services/GitHubService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import { Octokit } from '@octokit/rest';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGitHubClient } from '../interfaces/IGitHubClient';
import type { IGitHubService } from '../interfaces/IGitHubService';
import type { IConfig } from '../interfaces/IConfig';

@injectable()
export class GitHubService implements IGitHubService {
  private owner: string;
  private repo: string;

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
  ) {
    this.owner = this.configService.GITHUB_OWNER;
    this.repo = this.configService.GITHUB_REPO;
    // Validate owner and repo
    if (!this.owner || !this.repo) {
      console.error('GitHub owner or repo is not set correctly');
    }
    // If repo contains a '/', split it
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }

    console.log(
      `GitHubService initialized with owner: ${this.owner}, repo: ${this.repo}`,
    );
  }

  async fetchData(): Promise<IMetric[]> {
    try {
      console.log(`Fetching GitHub data for ${this.owner}/${this.repo}`);
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

      console.log(`Fetched ${pullRequests.length} pull requests`);

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
      console.error('Error fetching data from GitHub:', error);
      if (
        error instanceof Error &&
        'status' in error &&
        (error as any).status === 404
      ) {
        console.error(
          'This could be due to incorrect owner/repo or insufficient permissions',
        );
      }
      throw new Error(
        `Failed to fetch data from GitHub: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private calculateAveragePRCycleTime(pullRequests: any[]): number {
    const mergedPRs = pullRequests.filter(pr => pr.merged_at);
    if (mergedPRs.length === 0) return 0;

    const totalTime = mergedPRs.reduce((sum, pr) => {
      const createdAt = new Date(pr.created_at).getTime();
      const mergedAt = new Date(pr.merged_at).getTime();
      return sum + (mergedAt - createdAt) / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round(totalTime / mergedPRs.length);
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
