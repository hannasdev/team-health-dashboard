// src/__tests__/repositories/GitHubRepository.test.ts
import { createMockPullRequest } from '@/__mocks__/mockFactories';
import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  IGraphQLResponse,
} from '@/interfaces';
import { GitHubRepository } from '@/repositories/github/GitHubRepository';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';

describe('GitHubRepository', () => {
  let repository: GitHubRepository;
  let mockClient: jest.Mocked<IGitHubClient>;
  let mockConfig: jest.Mocked<IConfig>;
  let mockLogger: jest.Mocked<Logger>;
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeAll(() => {
    mockClient = {
      graphql: jest.fn(),
    } as unknown as jest.Mocked<IGitHubClient>;
    mockConfig = {
      GITHUB_OWNER: 'testowner',
      GITHUB_REPO: 'testrepo',
    } as unknown as jest.Mocked<IConfig>;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICacheService>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new GitHubRepository(
      mockClient,
      mockConfig,
      mockLogger,
      mockCacheService,
    );
  });

  describe('fetchPullRequests', () => {
    it('should fetch pull requests for the specified time period', async () => {
      const now = new Date();
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const mockGraphQLResponse: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: [
              {
                number: 1,
                title: 'Test PR 1',
                state: 'OPEN',
                author: { login: 'user1' },
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
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
              },
              {
                number: 2,
                title: 'Test PR 2',
                state: 'CLOSED',
                author: { login: 'user2' },
                createdAt: sixDaysAgo.toISOString(),
                updatedAt: sixDaysAgo.toISOString(),
                closedAt: now.toISOString(),
                mergedAt: now.toISOString(),
                commits: { totalCount: 2 },
                additions: 20,
                deletions: 15,
                changedFiles: 3,
                baseRefName: 'main',
                baseRefOid: 'base-sha-2',
                headRefName: 'feature-2',
                headRefOid: 'head-sha-2',
              },
            ],
          },
        },
      };

      mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

      const result = await repository.fetchPullRequests(7);

      // CHANGED: Check the structure of the result
      expect(result).toEqual({
        pullRequests: expect.arrayContaining([
          expect.objectContaining({
            number: 1,
            title: 'Test PR 1',
            // ... other properties
          }),
          expect.objectContaining({
            number: 2,
            title: 'Test PR 2',
            // ... other properties
          }),
        ]),
        totalPRs: 2,
        fetchedPRs: 2,
        timePeriod: 7,
      });

      expect(result.pullRequests).toHaveLength(2);

      expect(mockClient.graphql).toHaveBeenCalledWith(
        expect.stringContaining(
          'query($owner: String!, $repo: String!, $cursor: String)',
        ),
        expect.objectContaining({
          owner: 'testowner',
          repo: 'testrepo',
          cursor: null,
        }),
      );
    });

    it('should handle pagination', async () => {
      const now = new Date();
      const mockGraphQLResponse1: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor1',
            },
            nodes: Array(100).fill({
              number: 1,
              title: 'Test PR',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
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
            }),
          },
        },
      };

      const mockGraphQLResponse2: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: Array(50).fill({
              number: 2,
              title: 'Test PR 2',
              state: 'CLOSED',
              author: { login: 'user2' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              closedAt: now.toISOString(),
              mergedAt: now.toISOString(),
              commits: { totalCount: 2 },
              additions: 20,
              deletions: 15,
              changedFiles: 3,
              baseRefName: 'main',
              baseRefOid: 'base-sha-2',
              headRefName: 'feature-2',
              headRefOid: 'head-sha-2',
            }),
          },
        },
      };

      mockClient.graphql
        .mockResolvedValueOnce(mockGraphQLResponse1)
        .mockResolvedValueOnce(mockGraphQLResponse2);

      const result = await repository.fetchPullRequests(7);

      // CHANGED: Check the structure of the result
      expect(result).toEqual({
        pullRequests: expect.arrayContaining([
          expect.objectContaining({
            number: expect.any(Number),
            title: expect.any(String),
            // ... other properties
          }),
        ]),
        totalPRs: 150,
        fetchedPRs: 150,
        timePeriod: 7,
      });

      expect(result.pullRequests).toHaveLength(150);
      expect(mockClient.graphql).toHaveBeenCalledTimes(2);
    });

    it('should call progress callback if provided', async () => {
      const now = new Date();
      const mockGraphQLResponse: IGraphQLResponse = {
        repository: {
          pullRequests: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: Array(50).fill({
              number: 1,
              title: 'Test PR',
              state: 'OPEN',
              author: { login: 'user1' },
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
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
            }),
          },
        },
      };

      mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

      const mockProgressCallback: ProgressCallback = jest.fn();

      await repository.fetchPullRequests(7, mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledWith(
        50,
        Infinity,
        'Fetched 50 pull requests',
      );
    });

    it('should handle errors during API requests', async () => {
      const error = new Error('API Error');
      mockClient.graphql.mockRejectedValue(error);

      await expect(repository.fetchPullRequests(7)).rejects.toThrow(
        'Failed to fetch pull requests: API Error',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching pull requests:',
        error,
      );
    });

    it('should use cache when available', async () => {
      const cachedPRs = {
        pullRequests: [createMockPullRequest()],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 7,
      };

      (
        mockCacheService.get as jest.Mock<Promise<typeof cachedPRs>>
      ).mockResolvedValueOnce(cachedPRs);

      const result = await repository.fetchPullRequests(7);

      expect(result).toEqual(cachedPRs);
      expect(mockClient.graphql).not.toHaveBeenCalled();
    });
  });
});
