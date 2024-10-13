// src/repositories/github/GitHubRepository.ts
import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';

import {
  Cacheable,
  CacheableClass,
} from '../../../cross-cutting/CacheDecorator/index.js';
import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IGitHubMetricDocument,
  IGitHubPullRequest,
  IGitHubClient,
  IPullRequest,
  IGitHubRepository,
  IGraphQLResponse,
  IGraphQLPullRequest,
  ILogger,
  IMetric,
  IConfig,
  ICacheService,
} from '../../../interfaces';

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
    @inject(TYPES.GitHubPullRequestModel)
    private GitHubPullRequest: Model<IGitHubPullRequest>,
    @inject(TYPES.GitHubMetricModel)
    private GitHubMetric: Model<IGitHubMetricDocument>,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
    this.owner = this.configService.REPO_OWNER;
    this.repo = this.configService.REPO_REPO;
    if (this.repo.includes('/')) {
      [this.owner, this.repo] = this.repo.split('/');
    }
  }

  /**
   * Fetches pull requests from the GitHub repository within a specified time period.
   *
   * @param timePeriod - The time period in days to fetch pull requests for.
   * @returns An object containing the fetched pull requests, the total number of pull requests, the number of fetched pull requests, and the time period.
   * @throws {AppError} If there is an error fetching the pull requests.
   */
  @Cacheable('github-prs', 3600) // Cache for 1 hour
  public async fetchPullRequests(timePeriod: number): Promise<{
    pullRequests: IPullRequest[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }> {
    const { since } = this.getDateRange(timePeriod);
    let pullRequests: IPullRequest[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let totalPRs = 0;

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

        // Update totalPRs if it's available in the response
        if (response.repository.pullRequests.totalCount) {
          totalPRs = response.repository.pullRequests.totalCount;
        }

        this.logger.info(`Fetched ${pullRequests.length} pull requests`);

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
        totalPRs: totalPRs,
        fetchedPRs: filteredPullRequests.length,
        timePeriod: timePeriod,
      };
    } catch (error) {
      this.logger.error('Error fetching pull requests:', error as Error);
      throw new AppError(
        500,
        `Failed to fetch pull requests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public async storeRawPullRequests(
    pullRequests: IPullRequest[],
  ): Promise<void> {
    try {
      await this.GitHubPullRequest.insertMany(
        pullRequests.map(pr => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          author: pr.author.login,
          createdAt: new Date(pr.createdAt),
          updatedAt: new Date(pr.updatedAt),
          closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
          mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changedFiles,
        })),
      );
      this.logger.info(`Stored ${pullRequests.length} raw pull requests`);
    } catch (error) {
      this.logger.error('Error storing raw pull requests:', error as Error);
      throw new AppError(500, 'Failed to store raw pull requests');
    }
  }

  public async getRawPullRequests(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<IPullRequest[]> {
    try {
      const skip = (page - 1) * pageSize;

      const pullRequests = await this.GitHubPullRequest.find({
        processed: false,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec();

      return pullRequests.map(this.mapMongoDocumentToPullRequest);
    } catch (error) {
      this.logger.error(
        'Error fetching pull requests from database:',
        error as Error,
      );
      throw new AppError(500, 'Failed to fetch pull requests from database');
    }
  }

  public async storeProcessedMetrics(metrics: IMetric[]): Promise<void> {
    try {
      await this.GitHubMetric.insertMany(metrics);
      this.logger.info(`Stored ${metrics.length} processed metrics`);
    } catch (error) {
      this.logger.error('Error storing processed metrics:', error as Error);
      throw new AppError(500, 'Failed to store processed metrics');
    }
  }

  public async getProcessedMetrics(
    page: number,
    pageSize: number,
  ): Promise<IMetric[]> {
    try {
      const count = await this.GitHubMetric.countDocuments();
      this.logger.info(`Total GitHub metrics in database: ${count}`);

      const metrics = await this.GitHubMetric.find()
        .sort({ timestamp: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec();

      this.logger.info(`Retrieved ${metrics.length} GitHub metrics`);

      return metrics.map(this.mapToIMetric);
    } catch (error) {
      this.logger.error('Error fetching processed metrics:', error as Error);
      throw new AppError(500, 'Failed to fetch processed metrics');
    }
  }

  public async getTotalPRCount(): Promise<number> {
    try {
      return await this.GitHubPullRequest.countDocuments();
    } catch (error) {
      this.logger.error('Error counting pull requests:', error as Error);
      throw new AppError(500, 'Failed to count pull requests');
    }
  }

  public async syncPullRequests(timePeriod: number): Promise<void> {
    try {
      const { pullRequests } = await this.fetchPullRequests(timePeriod);
      for (const pr of pullRequests) {
        await this.GitHubPullRequest.findOneAndUpdate(
          { number: pr.number },
          this.mapToMongoDocument(pr),
          { upsert: true, new: true },
        );
      }
      this.logger.info(`Synced ${pullRequests.length} pull requests`);
    } catch (error) {
      this.logger.error('Error syncing pull requests:', error as Error);
      throw new AppError(500, 'Failed to sync pull requests');
    }
  }

  public async markPullRequestsAsProcessed(ids: string[]): Promise<void> {
    try {
      await this.GitHubPullRequest.updateMany(
        { _id: { $in: ids } },
        { $set: { processed: true, processedAt: new Date() } },
      );
      this.logger.info(`Marked ${ids.length} pull requests as processed`);
    } catch (error) {
      this.logger.error(
        'Error marking pull requests as processed:',
        error as Error,
      );
      throw new AppError(500, 'Failed to mark pull requests as processed');
    }
  }

  public async deleteAllMetrics(): Promise<void> {
    try {
      await this.GitHubMetric.deleteMany({});
      this.logger.info('Deleted all GitHub metrics');
    } catch (error) {
      this.logger.error('Error deleting GitHub metrics:', error as Error);
      throw new AppError(500, 'Failed to delete GitHub metrics');
    }
  }

  public async resetProcessedFlags(): Promise<void> {
    try {
      await this.GitHubPullRequest.updateMany(
        {},
        { $set: { processed: false, processedAt: null } },
      );
      this.logger.info('Reset processed flags for all pull requests');
    } catch (error) {
      this.logger.error('Error resetting processed flags:', error as Error);
      throw new AppError(500, 'Failed to reset processed flags');
    }
  }

  private mapToIMetric(doc: any): IMetric {
    return {
      _id: doc._id instanceof Types.ObjectId ? doc._id.toString() : doc._id,
      metric_category: doc.metric_category,
      metric_name: doc.metric_name,
      value: doc.value,
      timestamp: new Date(doc.timestamp),
      unit: doc.unit,
      additional_info: doc.additional_info,
      source: doc.source,
    };
  }

  private mapMongoDocumentToPullRequest(doc: any): IPullRequest {
    return {
      id: doc.id,
      number: doc.number,
      title: doc.title,
      state: doc.state as 'open' | 'closed' | 'merged',
      author: doc.author,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      closedAt: doc.closedAt,
      mergedAt: doc.mergedAt,
      additions: doc.additions,
      deletions: doc.deletions,
      changedFiles: doc.changedFiles,
      commits: doc.commits,
      baseRefName: doc.baseRefName,
      baseRefOid: doc.baseRefOid || '',
      headRefName: doc.headRefName || '',
      headRefOid: doc.headRefOid || '',
      processed: doc.processed || false,
      processedAt: doc.processedAt,
    };
  }

  private mapToMongoDocument(pr: IPullRequest): any {
    return {
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.author.login,
      createdAt: new Date(pr.createdAt),
      updatedAt: new Date(pr.updatedAt),
      closedAt: pr.closedAt ? new Date(pr.closedAt) : null,
      mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      commits: { totalCount: pr.commits.totalCount },
      baseRefName: pr.baseRefName,
      baseRefOid: pr.baseRefOid,
      headRefName: pr.headRefName,
      headRefOid: pr.headRefOid,
    };
  }

  private mapToPullRequest(node: IGraphQLPullRequest): IPullRequest {
    return {
      id: node.id,
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
      processed: false,
      processedAt: null,
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
              id
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
