// GitHubAdapter.ts
import { graphql } from '@octokit/graphql';
import { injectable, inject } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IGitHubAdapter,
  IRepositoryMetadata,
} from './interfaces/index.js';
import type { IConfig } from '../../../cross-cutting/Config/IConfig.js';
import type { IGitHubRepositoryMetadataResponse } from '../../repositories/GitHubRepository/interfaces/index.js';

@injectable()
export class GitHubAdapter implements IGitHubAdapter {
  constructor(@inject(TYPES.Config) private config: IConfig) {}

  public async graphql<T = any>(
    query: string,
    variables?: Record<string, any>,
    token?: string,
  ): Promise<T> {
    try {
      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${token || this.config.REPO_TOKEN}`,
        },
      });
      return await graphqlWithAuth<T>(query, variables);
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

      const response = await this.graphql<IGitHubRepositoryMetadataResponse>(
        query,
        { owner, name },
        token,
      );

      if (!response.repository) {
        return null;
      }

      return {
        isPrivate: response.repository.isPrivate,
        description: response.repository.description || undefined,
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
