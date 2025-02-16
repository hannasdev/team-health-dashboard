// src/services/GitHubService/GitHubService.test.ts

import { Container } from 'inversify';

import { GitHubService } from './GitHubService';
import {
  createMockCacheService,
  createMockGitHubRepository,
  createMockLogger,
  createMockMetric,
  createMockProcessingService,
  createMockPullRequest,
  createMockRepositoryRepository,
  createMockRepositoryModel,
} from '../../__mocks__/index';
import { MetricModel } from '../../data/models/metricModel/index.js';
import { RepositoryStatus } from '../../types/index';
import { AppError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

import type { ICacheService } from '../../cross-cutting/CacheService/ICacheService.js';
import type { ILogger } from '../../cross-cutting/Logger/ILogger.js';
import type { IGitHubRepository } from '../../data/repositories/GitHubRepository/index';
import type { IRepositoryRepository } from '../../data/repositories/RepositoryRepository/index.js';
import type { IProcessingService } from '../ProcessingService/index.js';

describe('GitHubService', () => {
  let container: Container;
  let gitHubService: GitHubService;
  let mockGitHubRepo: jest.Mocked<IGitHubRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockProcessingService: jest.Mocked<IProcessingService>;
  let mockRepoMetadataRepo: jest.Mocked<IRepositoryRepository>;

  beforeEach(() => {
    container = new Container();

    // Create all mocks first
    mockGitHubRepo = createMockGitHubRepository();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockProcessingService = createMockProcessingService();
    mockRepoMetadataRepo = createMockRepositoryRepository(); // We'll need to create this mock

    // Bind all dependencies
    container
      .bind<IGitHubRepository>(TYPES.GitHubRepository)
      .toConstantValue(mockGitHubRepo);
    container
      .bind<IProcessingService>(TYPES.ProcessingService)
      .toConstantValue(mockProcessingService);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    container
      .bind<IRepositoryRepository>(TYPES.RepositoryRepository)
      .toConstantValue(mockRepoMetadataRepo);

    // Bind the service last
    container.bind<GitHubService>(GitHubService).toSelf();
    gitHubService = container.get<GitHubService>(GitHubService);

    mockCacheService.clear();
  });

  describe('fetchAndStoreRawData', () => {
    it('should fetch and store raw pull request data successfully', async () => {
      const mockPullRequests = [
        createMockPullRequest(),
        createMockPullRequest(),
      ];
      const activeRepo = createMockRepositoryModel();

      // Reset and set up mocks
      mockRepoMetadataRepo.findAll.mockReset();
      mockRepoMetadataRepo.findAll.mockResolvedValueOnce({
        items: [activeRepo],
        total: 1,
        page: 0,
        pageSize: 1,
        hasMore: false,
      });

      mockGitHubRepo.fetchPullRequests.mockResolvedValueOnce({
        pullRequests: mockPullRequests,
        totalPRs: 100,
        fetchedPRs: 2,
        timePeriod: 30,
      });

      // Override the cache methods to ensure no caching
      mockCacheService.get.mockImplementation(async () => null);
      mockCacheService.set.mockImplementation(async () => {});

      await gitHubService.fetchAndStoreRawData(30);

      expect(mockRepoMetadataRepo.findAll).toHaveBeenCalledWith({
        status: RepositoryStatus.ACTIVE,
        syncEnabled: true,
        page: 0,
        pageSize: 1,
      });
    });

    it('should throw an AppError when no active repository is found', async () => {
      // Override cache behavior
      mockCacheService.get.mockImplementation(async () => null);
      mockCacheService.set.mockImplementation(async () => {});

      // Set up empty repository response
      mockRepoMetadataRepo.findAll.mockReset();
      mockRepoMetadataRepo.findAll.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 0,
        pageSize: 1,
        hasMore: false,
      });

      const promise = gitHubService.fetchAndStoreRawData(30);

      await expect(promise).rejects.toThrow(
        new AppError(404, 'No active repositories configured'),
      );

      expect(mockRepoMetadataRepo.findAll).toHaveBeenCalledWith({
        status: RepositoryStatus.ACTIVE,
        syncEnabled: true,
        page: 0,
        pageSize: 1,
      });
    });

    it('should use cached data when available', async () => {
      const cachedData = { cached: true };

      // Set up cache hit
      await mockCacheService.set('github-raw-data', cachedData, 3600);

      await gitHubService.fetchAndStoreRawData(30);

      expect(mockRepoMetadataRepo.findAll).not.toHaveBeenCalled();
    });

    it('should throw an AppError when repository has no credentials', async () => {
      const repoWithoutCreds = {
        ...createMockRepositoryModel(),
        credentials: undefined,
      };

      // CHANGED: Reset and set up mock for repository without credentials
      mockRepoMetadataRepo.findAll.mockReset();
      mockRepoMetadataRepo.findAll.mockResolvedValue({
        items: [repoWithoutCreds],
        total: 1,
        page: 0,
        pageSize: 1,
        hasMore: false,
      });

      await expect(gitHubService.fetchAndStoreRawData(30)).rejects.toThrow(
        'Repository credentials not configured',
      );
    });

    it('should throw an AppError when fetching fails', async () => {
      mockGitHubRepo.fetchPullRequests.mockRejectedValue(
        new Error('API Error'),
      );

      await expect(gitHubService.fetchAndStoreRawData(30)).rejects.toThrow(
        new AppError(500, 'Failed to fetch and store raw GitHub data'),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching and storing raw GitHub data:',
        expect.any(Error),
      );
    });
  });

  describe('getProcessedMetrics', () => {
    it('should return processed metrics', async () => {
      const mockMetrics: MetricModel[] = [
        createMockMetric(),
        createMockMetric(),
      ];
      mockGitHubRepo.getProcessedMetrics.mockResolvedValue(mockMetrics);

      const result = await gitHubService.getProcessedMetrics(1, 10);

      expect(result).toEqual(mockMetrics);
      expect(mockGitHubRepo.getProcessedMetrics).toHaveBeenCalledWith(1, 10);
    });

    it('should throw an AppError when fetching processed metrics fails', async () => {
      mockGitHubRepo.getProcessedMetrics.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(gitHubService.getProcessedMetrics(1, 10)).rejects.toThrow(
        AppError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching processed metrics:',
        expect.any(Error),
      );
    });
  });

  describe('syncData', () => {
    it('should sync pull requests data with active repository', async () => {
      await gitHubService.syncData(30);

      expect(mockRepoMetadataRepo.findAll).toHaveBeenCalledWith({
        status: RepositoryStatus.ACTIVE,
        syncEnabled: true,
        page: 0,
        pageSize: 1,
      });
      expect(mockGitHubRepo.syncPullRequests).toHaveBeenCalledWith(30); // Check just timePeriod
      expect(mockProcessingService.processGitHubData).toHaveBeenCalled();
    });

    it('should throw an AppError when syncing fails', async () => {
      mockGitHubRepo.syncPullRequests.mockRejectedValue(
        new Error('Sync Error'),
      );

      await expect(gitHubService.syncData(30)).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error syncing GitHub data:',
        expect.any(Error),
      );
    });
  });

  describe('getTotalPRCount', () => {
    it('should return the total PR count', async () => {
      const expectedCount = 100;
      mockGitHubRepo.getTotalPRCount.mockResolvedValue(expectedCount);

      const result = await gitHubService.getTotalPRCount();

      expect(result).toBe(expectedCount);
      expect(mockGitHubRepo.getTotalPRCount).toHaveBeenCalled();
    });

    it('should throw an AppError when getting total PR count fails', async () => {
      mockGitHubRepo.getTotalPRCount.mockRejectedValue(new Error('DB Error'));

      await expect(gitHubService.getTotalPRCount()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting total PR count:',
        expect.any(Error),
      );
    });
  });

  describe('resetData', () => {
    it('should reset GitHub data successfully', async () => {
      mockGitHubRepo.deleteAllMetrics.mockResolvedValue(undefined);
      mockGitHubRepo.resetProcessedFlags.mockResolvedValue(undefined);
      mockGitHubRepo.getTotalPRCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);

      await gitHubService.resetData();

      expect(mockGitHubRepo.deleteAllMetrics).toHaveBeenCalled();
      expect(mockGitHubRepo.resetProcessedFlags).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Before reset: 10 metrics');
      expect(mockLogger.info).toHaveBeenCalledWith('After reset: 0 metrics');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reset GitHub data successfully',
      );
    });

    it('should throw an AppError when reset fails due to remaining metrics', async () => {
      mockGitHubRepo.deleteAllMetrics.mockResolvedValue(undefined);
      mockGitHubRepo.resetProcessedFlags.mockResolvedValue(undefined);
      mockGitHubRepo.getTotalPRCount.mockResolvedValue(10); // Simulating metrics remaining after reset

      await expect(gitHubService.resetData()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error resetting GitHub data:',
        expect.any(Error),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error details:',
        expect.any(Error),
      );
    });

    it('should throw an AppError when deleteAllMetrics fails', async () => {
      mockGitHubRepo.deleteAllMetrics.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(gitHubService.resetData()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error resetting GitHub data:',
        expect.any(Error),
      );
    });

    it('should throw an AppError when resetProcessedFlags fails', async () => {
      mockGitHubRepo.deleteAllMetrics.mockResolvedValue(undefined);
      mockGitHubRepo.resetProcessedFlags.mockRejectedValue(
        new Error('Reset flags failed'),
      );

      await expect(gitHubService.resetData()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error resetting GitHub data:',
        expect.any(Error),
      );
    });
  });
});
