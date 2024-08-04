// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import { injectable, inject } from 'inversify';

import { TYPES } from '../utils/types';

import type { IGitHubClient, IConfig } from '../interfaces';

/**
 * GitHubAdapter
 *
 * This adapter implements the IGitHubClient interface using Octokit,
 * the official GitHub REST API client. It provides methods for
 * paginated requests and general API requests to GitHub.
 *
 * @implements {IGitHubClient}
 */
@injectable()
export class GitHubAdapter implements IGitHubClient {
  private octokit: Octokit;
  private graphqlWithAuth: typeof graphql;

  /**
   * Creates an instance of GitHubAdapter.
   * @param {IConfig} config - The configuration object containing the GitHub token
   */
  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.octokit = new Octokit({
      auth: this.config.GITHUB_TOKEN,
    });
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${this.config.GITHUB_TOKEN}`,
      },
    });
  }

  /**
   * Sends a request to the GitHub API.
   * @param {string} route - The API route to request
   * @param {RequestParameters} [params] - Additional parameters for the request
   * @returns {Promise<any>} A promise that resolves with the API response
   */
  async request(route: string, options?: any): Promise<any> {
    return this.octokit.request(route, options);
  }

  async graphql(query: string, variables?: any): Promise<any> {
    return this.graphqlWithAuth(query, variables);
  }
}
