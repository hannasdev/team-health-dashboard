// src/interfaces/IGraphQLResponse.ts
import { IGraphQLPullRequest } from './IGraphQLPullRequest.js';

export interface IGraphQLResponse {
  repository: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: IGraphQLPullRequest[];
      totalCount: number;
    };
  };
}
