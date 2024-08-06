// src/interfaces/IGraphQLResponse.ts
import { IGraphQLPullRequest } from './IGraphQLPullRequest';

export interface IGraphQLResponse {
  repository: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: IGraphQLPullRequest[];
    };
  };
}
