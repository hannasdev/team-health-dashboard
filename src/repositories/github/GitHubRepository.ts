// src/repositories/github/GitHubRepository.ts
import { injectable, inject } from 'inversify';

import { Cacheable, CacheableClass } from '../../utils/CacheDecorator/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  IPullRequest,
  IGitHubRepository,
  IGraphQLResponse,
  IGraphQLPullRequest,
  ILogger,
} from '../../interfaces';
import type { ProgressCallback } from '../../types/index.js';

@injectable()
export class GitHubRepository
  extends CacheableClass
  implements IGitHubRepository
{
  private owner: string;
  private repo: string;
  private readonly timeout: number = 300000; // 5 minutes timeout

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
    this.owner = this.configService.REPO_OWNER;
    this.repo = this.configService.REPO_REPO;
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  @Cacheable('github-prs', 3600) // Cache for 1 hour
  async fetchPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }> {
    const { since } = this.getDateRange(timePeriod);
    let pullRequests: IPullRequest[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let estimatedTotal = 0;

    const startTime = Date.now();

    try {
      while (hasNextPage) {
        if (Date.now() - startTime > this.timeout) {
          throw new Error('Operation timed out');
        }

        const response: IGraphQLResponse = await this.client.graphql(
          this.getPRQuery(),
          {
            owner: this.owner,
            repo: this.repo,
            cursor: cursor,
          },
        );

        const newPRs = response.repository.pullRequests.nodes.map(
          (node: IGraphQLPullRequest) => this.mapToPullRequest(node),
        );
        pullRequests = [...pullRequests, ...newPRs];

        // Update estimated total after first fetch
        if (estimatedTotal === 0) {
          estimatedTotal = Math.max(100, newPRs.length * 2); // Assume at least one more page
        }

        hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
        cursor = response.repository.pullRequests.pageInfo.endCursor;

        progressCallback?.(
          pullRequests.length,
          Infinity,
          `Fetched ${pullRequests.length} pull requests`,
        );

        if (pullRequests.length > estimatedTotal) {
          estimatedTotal = pullRequests.length + 100; // Assume at least one more page
        }

        if (
          newPRs.length > 0 &&
          new Date(newPRs[newPRs.length - 1].createdAt) < new Date(since)
        ) {
          break;
        }
      }

      const filteredPullRequests = pullRequests.filter(
        pr => new Date(pr.createdAt) >= new Date(since),
      );

      return {
        pullRequests: filteredPullRequests,
        totalPRs: filteredPullRequests.length,
        fetchedPRs: filteredPullRequests.length,
        timePeriod,
      };
    } catch (error) {
      this.logger.error('Error fetching pull requests:', error as Error);
      throw new AppError(
        500,
        `Failed to fetch pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private mapToPullRequest(node: IGraphQLPullRequest): IPullRequest {
    return {
      number: node.number,
      title: node.title,
      state: this.mapState(node.state),
      author: {
        login: node.author?.login || 'unknown',
      },
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      closedAt: node.closedAt,
      mergedAt: node.mergedAt,
      commits: node.commits,
      additions: node.additions,
      deletions: node.deletions,
      changedFiles: node.changedFiles,
      baseRefName: node.baseRefName,
      baseRefOid: node.baseRefOid,
      headRefName: node.headRefName,
      headRefOid: node.headRefOid,
    };
  }

  private mapState(state: string): 'open' | 'closed' | 'merged' {
    switch (state.toLowerCase()) {
      case 'open':
        return 'open';
      case 'closed':
        return 'closed';
      case 'merged':
        return 'merged';
      default:
        return 'closed'; // Default to closed if unknown state
    }
  }

  private getPRQuery(): string {
    return `
      query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: 100, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              number
              title
              state
              author {
                login
              }
              createdAt
              updatedAt
              closedAt
              mergedAt
              commits {
                totalCount
              }
              additions
              deletions
              changedFiles
              baseRefName
              baseRefOid
              headRefName
              headRefOid
            }
          }
        }
      }
    `;
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
