// GitHubAdapter.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { IGitHubClient, IConfig } from '../interfaces/index';
import { Octokit } from '@octokit/rest';
import { RequestParameters } from '@octokit/types';

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

  /**
   * Creates an instance of GitHubAdapter.
   * @param {IConfig} config - The configuration object containing the GitHub token
   */
  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.octokit = new Octokit({ auth: config.GITHUB_TOKEN });
  }

  /**
   * Provides an iterator for paginated GitHub API requests.
   */
  paginate = {
    /**
     * Creates an async iterator for a paginated GitHub API request.
     * @param {string} route - The API route to request
     * @param {RequestParameters} [params] - Additional parameters for the request
     * @returns {AsyncIterableIterator<any>} An async iterator of the paginated results
     */
    iterator: (
      route: string,
      params?: RequestParameters,
    ): AsyncIterableIterator<any> =>
      this.octokit.paginate.iterator(route, params as any),
  };

  /**
   * Sends a request to the GitHub API.
   * @param {string} route - The API route to request
   * @param {RequestParameters} [params] - Additional parameters for the request
   * @returns {Promise<any>} A promise that resolves with the API response
   */
  request = (route: string, params?: RequestParameters): Promise<any> =>
    this.octokit.request(route, params);
}
