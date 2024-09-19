import { injectable } from 'inversify';

import type { IGitHubClient } from '../../interfaces/index.js';

@injectable()
export class MockGitHubAdapter implements IGitHubClient {
  graphql = jest.fn().mockResolvedValue({
    repository: {
      pullRequests: {
        nodes: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  });
}
