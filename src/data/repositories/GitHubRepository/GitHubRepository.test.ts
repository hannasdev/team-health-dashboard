import { Container } from 'inversify';

import { GitHubRepository } from './GitHubRepository.js';
import {
  createMockLogger,
  createMockCacheService,
  createMockGitHubClient,
  createMockMongooseModel,
  createMockPullRequest,
  createMockMetric,
  createMockConfig,
} from '../../../__mocks__/index.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IGitHubClient,
  IConfig,
  ICacheService,
  ILogger,
  IGitHubRepository,
  IGitHubPullRequest,
  IGitHubMetricDocument,
} from '../../../interfaces/index.js';

describe('GitHubRepository', () => {
  let container: Container;
  let gitHubRepository: IGitHubRepository;
  let mockClient: jest.Mocked<IGitHubClient>;
  let mockConfig: jest.Mocked<IConfig>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockGitHubPullRequestModel: ReturnType<
    typeof createMockMongooseModel<IGitHubPullRequest>
  >;
  let mockGitHubMetricModel: ReturnType<
    typeof createMockMongooseModel<IGitHubMetricDocument>
  >;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockClient = createMockGitHubClient();
    mockGitHubPullRequestModel = createMockMongooseModel<IGitHubPullRequest>();
    mockGitHubPullRequestModel.updateMany = jest.fn();
    mockGitHubMetricModel = createMockMongooseModel<IGitHubMetricDocument>();

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
      .bind(TYPES.GitHubPullRequestModel)
      .toConstantValue(mockGitHubPullRequestModel);
    container
      .bind(TYPES.GitHubMetricModel)
      .toConstantValue(mockGitHubMetricModel);
    container.bind(TYPES.GitHubRepository).to(GitHubRepository);

    gitHubRepository = container.get<GitHubRepository>(TYPES.GitHubRepository);

    jest.resetAllMocks();
  });

  describe('fetchPullRequests', () => {
    it('should fetch pull requests for the specified time period', async () => {
      const mockPRs = [
        createMockPullRequest(),
        createMockPullRequest({ number: 2 }),
      ];
      mockClient.graphql.mockResolvedValueOnce({
        repository: {
          pullRequests: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: mockPRs,
            totalCount: 2,
          },
        },
      });

      const result = await gitHubRepository.fetchPullRequests(7);

      expect(result).toEqual({
        pullRequests: mockPRs,
        totalPRs: 2,
        fetchedPRs: 2,
        timePeriod: 7,
      });
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
      const mockPRs1 = Array(100).fill(createMockPullRequest());
      const mockPRs2 = Array(50).fill(createMockPullRequest({ number: 2 }));

      mockClient.graphql
        .mockResolvedValueOnce({
          repository: {
            pullRequests: {
              pageInfo: { hasNextPage: true, endCursor: 'cursor1' },
              nodes: mockPRs1,
              totalCount: 150,
            },
          },
        })
        .mockResolvedValueOnce({
          repository: {
            pullRequests: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: mockPRs2,
              totalCount: 150,
            },
          },
        });

      const result = await gitHubRepository.fetchPullRequests(7);

      expect(result).toEqual({
        pullRequests: expect.arrayContaining([...mockPRs1, ...mockPRs2]),
        totalPRs: 150,
        fetchedPRs: 150,
        timePeriod: 7,
      });
      expect(mockClient.graphql).toHaveBeenCalledTimes(2);
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
      const cachedResult = {
        pullRequests: [createMockPullRequest()],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 7,
      };
      mockCacheService.get.mockResolvedValueOnce(cachedResult);

      const result = await gitHubRepository.fetchPullRequests(7);

      expect(result).toEqual(cachedResult);
      expect(mockClient.graphql).not.toHaveBeenCalled();
    });
  });

  describe('storeRawPullRequests', () => {
    it('should store raw pull requests', async () => {
      const pullRequests = [createMockPullRequest()];

      await gitHubRepository.storeRawPullRequests(pullRequests);

      expect(mockGitHubPullRequestModel.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            number: pullRequests[0].number,
            title: pullRequests[0].title,
            state: pullRequests[0].state,
            author: pullRequests[0].author.login,
          }),
        ]),
      );
    });

    it('should handle errors when storing raw pull requests', async () => {
      const pullRequests = [createMockPullRequest()];
      const error = new Error('Database error');
      mockGitHubPullRequestModel.insertMany.mockRejectedValue(error);

      await expect(
        gitHubRepository.storeRawPullRequests(pullRequests),
      ).rejects.toThrow('Failed to store raw pull requests');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error storing raw pull requests:',
        error,
      );
    });
  });

  describe('getRawPullRequests', () => {
    it('should get raw pull requests from database', async () => {
      const mockRawPullRequests = [
        createMockPullRequest(),
        createMockPullRequest(),
      ];
      mockGitHubPullRequestModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRawPullRequests),
      });

      try {
        const result = await gitHubRepository.getRawPullRequests(1, 20);
        expect(result).toEqual(mockRawPullRequests);
        expect(mockGitHubPullRequestModel.find).toHaveBeenCalledWith({
          processed: false,
        });
        expect(mockGitHubPullRequestModel.find().sort).toHaveBeenCalledWith({
          createdAt: -1,
        });
        expect(mockGitHubPullRequestModel.find().skip).toHaveBeenCalledWith(0);
        expect(mockGitHubPullRequestModel.find().limit).toHaveBeenCalledWith(
          20,
        );
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });

    it('should handle errors when fetching raw pull requests', async () => {
      mockGitHubPullRequestModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(gitHubRepository.getRawPullRequests(1, 20)).rejects.toThrow(
        'Failed to fetch pull requests from database',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching pull requests from database:',
        expect.any(Error),
      );
    });
  });

  describe('storeProcessedMetrics', () => {
    it('should store processed metrics', async () => {
      const metrics = [createMockMetric(), createMockMetric()];

      await gitHubRepository.storeProcessedMetrics(metrics);

      expect(mockGitHubMetricModel.insertMany).toHaveBeenCalledWith(metrics);
    });
  });

  describe('getProcessedMetrics', () => {
    it('should get processed metrics from database', async () => {
      const mockMetrics = [createMockMetric(), createMockMetric()];
      mockGitHubMetricModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMetrics),
      });

      const result = await gitHubRepository.getProcessedMetrics(1, 20);

      expect(result).toEqual(mockMetrics);
      expect(mockGitHubMetricModel.find().sort).toHaveBeenCalledWith({
        timestamp: -1,
      });
      expect(mockGitHubMetricModel.find().skip).toHaveBeenCalledWith(0);
      expect(mockGitHubMetricModel.find().limit).toHaveBeenCalledWith(20);
    });
  });

  describe('getTotalPRCount', () => {
    it('should return the total count of pull requests', async () => {
      mockGitHubPullRequestModel.countDocuments.mockResolvedValue(100);

      const result = await gitHubRepository.getTotalPRCount();

      expect(result).toBe(100);
      expect(mockGitHubPullRequestModel.countDocuments).toHaveBeenCalled();
    });
  });

  describe('syncPullRequests', () => {
    it('should sync pull requests', async () => {
      const mockPRs = [createMockPullRequest(), createMockPullRequest()];
      jest.spyOn(gitHubRepository, 'fetchPullRequests').mockResolvedValue({
        pullRequests: mockPRs,
        totalPRs: 2,
        fetchedPRs: 2,
        timePeriod: 7,
      });

      await gitHubRepository.syncPullRequests(7);

      expect(gitHubRepository.fetchPullRequests).toHaveBeenCalledWith(7);
      expect(mockGitHubPullRequestModel.findOneAndUpdate).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe('markPullRequestsAsProcessed', () => {
    it('should mark pull requests as processed', async () => {
      const ids = ['1', '2', '3'];
      mockGitHubPullRequestModel.updateMany.mockResolvedValue({
        modifiedCount: ids.length,
      });

      await gitHubRepository.markPullRequestsAsProcessed(ids);

      expect(mockGitHubPullRequestModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ids } },
        { $set: { processed: true, processedAt: expect.any(Date) } },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Marked ${ids.length} pull requests as processed`,
      );
    });

    it('should handle errors when marking pull requests as processed', async () => {
      const ids = ['1', '2', '3'];
      mockGitHubPullRequestModel.updateMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        gitHubRepository.markPullRequestsAsProcessed(ids),
      ).rejects.toThrow('Failed to mark pull requests as processed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error marking pull requests as processed:',
        expect.any(Error),
      );
    });
  });
});
