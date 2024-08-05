// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { injectable, inject } from 'inversify';

import { BaseDataAdapter } from './BaseDataAdapter';
import { IConfig, IPullRequest, IFetchDataResult } from '../interfaces';
import { ProgressCallback } from '../types';
import { Logger } from '../utils/Logger';
import { TYPES } from '../utils/types';

@injectable()
export class GitHubAdapter extends BaseDataAdapter {
  private graphqlWithAuth: typeof graphql;

  constructor(
    @inject(TYPES.Config) protected config: IConfig,
    @inject(TYPES.Logger) protected logger: Logger,
  ) {
    super(config, logger);
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${this.config.GITHUB_TOKEN}`,
      },
    });
  }

  async fetchData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult> {
    // Implementation
  }

  protected getCacheKey(): string {
    // Implementation
  }

  async fetchPullRequests(
    owner: string,
    repo: string,
    timePeriod: number,
    page: number,
    progressCallback?: ProgressCallback,
  ): Promise<IPullRequest[]> {
    try {
      progressCallback?.(0, 100, `Fetching page ${page} of pull requests`);

      const since = new Date();
      since.setDate(since.getDate() - timePeriod);

      const query = `
        query($owner: String!, $repo: String!, $since: DateTime, $cursor: String) {
          repository(owner: $owner, name: $repo) {
            pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}, after: $cursor, filterBy: {since: $since}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                number
                title
                state
                createdAt
                updatedAt
                closedAt
                mergedAt
                additions
                deletions
                changedFiles
                author {
                  login
                }
              }
            }
          }
        }
      `;

      const variables = {
        owner,
        repo,
        since: since.toISOString(),
        cursor:
          page > 1
            ? Buffer.from(`cursor:${(page - 1) * 100}`).toString('base64')
            : null,
      };

      const response: any = await this.graphqlWithAuth(query, variables);

      const pullRequests = response.repository.pullRequests.nodes.map(
        this.mapToPullRequest,
      );

      progressCallback?.(100, 100, `Fetched page ${page} of pull requests`);

      return pullRequests;
    } catch (error) {
      this.logger.error('Error fetching pull requests from GitHub:', error);
      throw new Error(
        `Failed to fetch pull requests: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private mapToPullRequest(node: any): IPullRequest {
    return {
      id: node.number,
      number: node.number,
      title: node.title,
      state: node.state.toLowerCase(),
      user: {
        login: node.author ? node.author.login : 'unknown',
      },
      created_at: node.createdAt,
      updated_at: node.updatedAt,
      closed_at: node.closedAt,
      merged_at: node.mergedAt,
      additions: node.additions,
      deletions: node.deletions,
      changed_files: node.changedFiles,
    };
  }
}
