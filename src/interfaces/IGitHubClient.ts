// src/interfaces/IGitHubClient.ts

import { RequestParameters } from '@octokit/types';

export interface IGitHubClient {
  paginate: {
    iterator: (
      route: string,
      params?: RequestParameters,
    ) => AsyncIterableIterator<any>;
  };
  request: (route: string, params?: RequestParameters) => Promise<any>;
}
