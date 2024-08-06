// src/interfaces/IGitHubClient.ts
import { IGraphQLResponse } from './IGraphQLResponse';

export interface IGitHubClient {
  graphql<T = IGraphQLResponse>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T>;
}
