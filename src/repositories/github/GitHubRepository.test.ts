// src/__tests__/repositories/GitHubRepository.test.ts

import { Container } from 'inversify';
import { IGraphQLResponse } from '../../interfaces/index.js';
import {
  IGitHubClient,
  IConfig,
  ICacheService,
  ILogger,
  IPullRequest,
  IGitHubRepository,
} from '../../interfaces/index.js';
import { Config } from '../../config/config.js';
import { GitHubRepository } from '../../repositories/github/GitHubRepository.js';
import { TYPES } from '../../utils/types.js';
import {
  createMockLogger,
  createMockCacheService,
  createMockGitHubClient,
} from '../../__mocks__/mockFactories.js';
import { ProgressCallback } from '../../types/index.js';

describe('GitHubRepository', () => {
  let container: Container;
  let gitHubRepository: IGitHubRepository;
  let mockClient: jest.Mocked<IGitHubClient>;
  let mockConfig: IConfig;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;

  const testConfig = {
    GITHUB_OWNER: 'github_owner_test',
    GITHUB_REPO: 'github_repo_test',
    JWT_SECRET: 'test-secret',
    GITHUB_TOKEN: 'test-github-token',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test-google-sheets-private-key',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test-client-email@example.com',
    GOOGLE_SHEETS_SHEET_ID: 'test-sheet-id',
    MONGODB_URI: 'mongodb://localhost:27017/test-db',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
  };

  beforeEach(() => {
    mockConfig = Config.getInstance(testConfig);
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockClient = createMockGitHubClient();

    container = new Container();
    container
      .bind<IGitHubClient>(TYPES.GitHubClient)
      .toConstantValue(mockClient);
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    container
      .bind<IGitHubRepository>(TYPES.GitHubRepository)
      .to(GitHubRepository);

    gitHubRepository = container.get<IGitHubRepository>(TYPES.GitHubRepository);

    jest.resetAllMocks();
  });

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
          totalCount: 2,
        },
      },
    };

    mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

    const result = await gitHubRepository.fetchPullRequests(7);

    expect(result).toEqual({
      pullRequests: expect.arrayContaining([
        expect.objectContaining<Partial<IPullRequest>>({
          number: 1,
          title: 'Test PR 1',
        }),
        expect.objectContaining<Partial<IPullRequest>>({
          number: 2,
          title: 'Test PR 2',
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
        owner: 'github_owner_test',
        repo: 'github_repo_test',
        cursor: null,
      }),
    );
  });

  it('should handle pagination', async () => {
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
          }),
          totalCount: 100,
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            mergedAt: new Date().toISOString(),
            commits: { totalCount: 2 },
            additions: 20,
            deletions: 15,
            changedFiles: 3,
            baseRefName: 'main',
            baseRefOid: 'base-sha-2',
            headRefName: 'feature-2',
            headRefOid: 'head-sha-2',
          }),
          totalCount: 50,
        },
      },
    };

    mockClient.graphql
      .mockResolvedValueOnce(mockGraphQLResponse1)
      .mockResolvedValueOnce(mockGraphQLResponse2);

    const result = await gitHubRepository.fetchPullRequests(7);

    expect(result).toEqual({
      pullRequests: expect.arrayContaining([
        expect.objectContaining<Partial<IPullRequest>>({
          number: expect.any(Number),
          title: expect.any(String),
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
          }),
          totalCount: 50,
        },
      },
    };

    mockClient.graphql.mockResolvedValueOnce(mockGraphQLResponse);

    const mockProgressCallback: ProgressCallback = jest.fn();

    await gitHubRepository.fetchPullRequests(7, mockProgressCallback);

    expect(mockProgressCallback).toHaveBeenCalledWith(
      50,
      expect.any(Number),
      'Fetched 50 pull requests',
    );
  });

  it('should handle errors during API requests', async () => {
    const error = new Error('API Error');
    mockClient.graphql.mockRejectedValue(error);

    await expect(gitHubRepository.fetchPullRequests(7)).rejects.toThrow(
      'Failed to fetch pull requests: API Error',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching pull requests:',
      error,
    );
  });

  it('should use cache when available', async () => {
    const cachedPRs = {
      pullRequests: [
        {
          number: 1,
          title: 'Cached PR',
          state: 'OPEN',
          author: { login: 'user1' },
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
        },
      ],
      totalPRs: 1,
      fetchedPRs: 1,
      timePeriod: 7,
    };

    mockCacheService.get.mockResolvedValueOnce(cachedPRs);

    const result = await gitHubRepository.fetchPullRequests(7);

    expect(result).toEqual(cachedPRs);
    expect(mockClient.graphql).not.toHaveBeenCalled();
  });
});
