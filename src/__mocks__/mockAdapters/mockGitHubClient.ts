import type {
  IGitHubClient,
  IGraphQLResponse,
} from '../../interfaces/index.js';

export function createMockGitHubClient(): jest.Mocked<IGitHubClient> {
  return {
    graphql: jest
      .fn()
      .mockImplementation(
        async <T = IGraphQLResponse>(
          query: string,
          variables?: Record<string, any>,
        ): Promise<T> => {
          // Default mock implementation
          return {} as T;
        },
      ),
  };
}
