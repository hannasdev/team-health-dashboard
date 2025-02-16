// src/interfaces/IGitHubClient.ts
import { IGraphQLResponse } from './IGraphQLResponse.js';

export interface IRepositoryMetadata {
  isPrivate: boolean;
  description?: string;
  defaultBranch: string;
  topics?: string[];
  primaryLanguage?: string;
}
export interface IGitHubAdapter {
  graphql<T = IGraphQLResponse>(
    query: string,
    variables?: Record<string, any>,
    token?: string,
  ): Promise<T>;
  getRepositoryMetadata(params: {
    owner: string;
    name: string;
    token?: string;
  }): Promise<IRepositoryMetadata | null>;
}
