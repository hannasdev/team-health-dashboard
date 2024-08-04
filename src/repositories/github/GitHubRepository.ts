// src/repositories/github/GitHubRepository.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../utils/types';
import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  IPullRequest,
  IGitHubRepository,
} from '../../interfaces';
import { Logger } from '../../utils/Logger';
import { Cacheable, CacheableClass } from '../../utils/CacheDecorator';
import type { ProgressCallback } from '../../types';

interface IGraphQLPullRequest {
  number: number;
  title: string;
  state: string;
  author: { login: string } | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  commits: { totalCount: number };
  additions: number;
  deletions: number;
  changedFiles: number;
  baseRefName: string;
  baseRefOid: string;
  headRefName: string;
  headRefOid: string;
}

interface IGraphQLResponse {
  repository: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: IGraphQLPullRequest[];
    };
  };
}

@injectable()
export class GitHubRepository
  extends CacheableClass
  implements IGitHubRepository
{
  private owner: string;
  private repo: string;
  private timeout: number = 300000; // 5 minutes timeout

  constructor(
    @inject(TYPES.GitHubClient) private client: IGitHubClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
    this.owner = this.configService.GITHUB_OWNER;
    this.repo = this.configService.GITHUB_REPO;
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  @Cacheable('github-prs', 3600) // Cache for 1 hour
  async fetchPullRequests(
    timePeriod: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    const { since } = this.getDateRange(timePeriod);
    let pullRequests: IPullRequest[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

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

        hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
        cursor = response.repository.pullRequests.pageInfo.endCursor;

        progressCallback?.(
          pullRequests.length,
          Infinity,
          `Fetched ${pullRequests.length} pull requests`,
        );

        // Break if we've gone past the 'since' date
        if (
          newPRs.length > 0 &&
          new Date(newPRs[newPRs.length - 1].created_at) < new Date(since)
        ) {
          break;
        }
      }

      return pullRequests.filter(
        pr => new Date(pr.created_at) >= new Date(since),
      );
    } catch (error) {
      this.logger.error('Error fetching pull requests:', error as Error);
      throw new Error(
        `Failed to fetch pull requests: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private mapToPullRequest(node: IGraphQLPullRequest): IPullRequest {
    return {
      id: node.number,
      number: node.number,
      title: node.title,
      state: this.mapState(node.state),
      user: {
        login: node.author?.login || 'unknown',
      },
      created_at: node.createdAt,
      updated_at: node.updatedAt,
      closed_at: node.closedAt,
      merged_at: node.mergedAt,
      commits: node.commits.totalCount,
      additions: node.additions,
      deletions: node.deletions,
      changed_files: node.changedFiles,
      base: {
        ref: node.baseRefName,
        sha: node.baseRefOid,
      },
      head: {
        ref: node.headRefName,
        sha: node.headRefOid,
      },
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
