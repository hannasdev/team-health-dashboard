// src/interfaces/IGitHubClient.ts
import { RequestParameters } from '@octokit/types';

export interface IGitHubClient {
  request: (route: string, params?: RequestParameters) => Promise<any>;
  graphql(query: string, variables?: any): Promise<any>;
}
