// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { injectable, inject } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IGitHubClient,
  IConfig,
  IRepositoryMetadata,
} from '../../../interfaces/index.js';

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

  public async graphql<T = any>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    try {
      return await this.graphqlWithAuth<T>(query, variables);
    } catch (error) {
      throw new AppError(
        502,
        `GitHub GraphQL query failed: ${(error as Error).message}`,
      );
    }
  }

  public async getRepositoryMetadata({
    owner,
    name,
    token,
  }: {
    owner: string;
    name: string;
    token?: string;
  }): Promise<IRepositoryMetadata | null> {
    try {
      const query = `
      query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          isPrivate
          description
          defaultBranchRef {
            name
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          primaryLanguage {
            name
          }
        }
      }
    `;

      const response = await this.graphql(query, { owner, name });

      if (!response.repository) {
        return null;
      }

      return {
        isPrivate: response.repository.isPrivate,
        description: response.repository.description,
        defaultBranch: response.repository.defaultBranchRef.name,
        topics: response.repository.repositoryTopics.nodes.map(
          (node: any) => node.topic.name,
        ),
        primaryLanguage: response.repository.primaryLanguage?.name,
      };
    } catch (error) {
      // If we get a NotFound error from GitHub, return null
      // Otherwise, rethrow the error
      if (
        (error as any).message?.includes('Could not resolve to a Repository')
      ) {
        return null;
      }
      throw new AppError(
        502,
        `GitHub GraphQL query failed: ${(error as Error).message}`,
      );
    }
  }
}
