import type {
  IGitHubClient,
  IGitHubRepository,
  IGoogleSheetsRepository,
  IGraphQLResponse,
  IPullRequest,
  IUserRepository,
} from '../interfaces/index.js';

export function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  } as unknown as jest.Mocked<IUserRepository>;
}

export const createMockGitHubRepository =
  (): jest.Mocked<IGitHubRepository> => ({
    fetchPullRequests: jest.fn().mockResolvedValue({
      pullRequests: [createMockPullRequest()],
      totalPRs: 1,
      fetchedPRs: 1,
      timePeriod: 90,
    }),
  });

// Helper function to create mock pull requests
export const createMockPullRequest = (
  overrides: Partial<IPullRequest> = {},
): IPullRequest => ({
  number: 1,
  title: 'Test PR',
  state: 'open',
  author: { login: 'testuser' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  closedAt: null,
  mergedAt: null,
  commits: { totalCount: 1 },
  additions: 10,
  deletions: 5,
  changedFiles: 2,
  baseRefName: 'main',
  baseRefOid: 'base-sha',
  headRefName: 'feature',
  headRefOid: 'head-sha',
  ...overrides,
});

export const createMockGoogleSheetsRepository =
  (): jest.Mocked<IGoogleSheetsRepository> => ({
    fetchMetrics: jest.fn(),
  });

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
