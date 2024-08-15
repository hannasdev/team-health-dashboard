// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { injectable, inject } from 'inversify';

import type { IGitHubClient, IConfig } from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

@injectable()
export class GitHubAdapter implements IGitHubClient {
  private graphqlWithAuth: typeof graphql;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${this.config.REPO_TOKEN}`,
      },
    });
  }

  async graphql<T = any>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    try {
      return await this.graphqlWithAuth<T>(query, variables);
    } catch (error) {
      throw new Error(
        `GitHub GraphQL query failed: ${(error as Error).message}`,
      );
    }
  }
}
