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
} from '../../__mocks__/index';
import { AppError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

import type {
  ICacheService,
  IGitHubRepository,
  ILogger,
  IMetric,
  IProcessingService,
  IPullRequest,
} from '../../interfaces/index';

describe('GitHubService', () => {
  let container: Container;
  let gitHubService: GitHubService;
  let mockRepository: jest.Mocked<IGitHubRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockProcessingService: jest.Mocked<IProcessingService>;

  beforeEach(() => {
    container = new Container();
    mockRepository = createMockGitHubRepository();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockProcessingService = createMockProcessingService();

    container
      .bind<IGitHubRepository>(TYPES.GitHubRepository)
      .toConstantValue(mockRepository);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    container
      .bind<IProcessingService>(TYPES.ProcessingService)
      .toConstantValue(mockProcessingService);
    container.bind<GitHubService>(GitHubService).toSelf();

    gitHubService = container.get<GitHubService>(GitHubService);
  });

  describe('fetchAndStoreRawData', () => {
    it('should fetch and store raw pull request data successfully', async () => {
      const mockPullRequests: IPullRequest[] = [
        createMockPullRequest(),
        createMockPullRequest(),
      ];
      mockRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: mockPullRequests,
        totalPRs: 100,
        fetchedPRs: 2,
        timePeriod: 30,
      });

      await gitHubService.fetchAndStoreRawData(30);

      expect(mockRepository.fetchPullRequests).toHaveBeenCalledWith(30);
      expect(mockRepository.storeRawPullRequests).toHaveBeenCalledWith(
        mockPullRequests,
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Fetched 2 pull requests out of 100 total PRs for the last 30 days',
        ),
      );
    });

    it('should throw an AppError when fetching fails', async () => {
      mockRepository.fetchPullRequests.mockRejectedValue(
        new Error('API Error'),
      );

      await expect(gitHubService.fetchAndStoreRawData(30)).rejects.toThrow(
        AppError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching and storing raw GitHub data:',
        expect.any(Error),
      );
    });
  });

  describe('getProcessedMetrics', () => {
    it('should return processed metrics', async () => {
      const mockMetrics: IMetric[] = [createMockMetric(), createMockMetric()];
      mockRepository.getProcessedMetrics.mockResolvedValue(mockMetrics);

      const result = await gitHubService.getProcessedMetrics(1, 10);

      expect(result).toEqual(mockMetrics);
      expect(mockRepository.getProcessedMetrics).toHaveBeenCalledWith(1, 10);
    });

    it('should throw an AppError when fetching processed metrics fails', async () => {
      mockRepository.getProcessedMetrics.mockRejectedValue(
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
    it('should sync pull requests data', async () => {
      await gitHubService.syncData(30);

      expect(mockRepository.syncPullRequests).toHaveBeenCalledWith(30);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Synced GitHub data for the last 30 days',
      );
    });

    it('should throw an AppError when syncing fails', async () => {
      mockRepository.syncPullRequests.mockRejectedValue(
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
      mockRepository.getTotalPRCount.mockResolvedValue(expectedCount);

      const result = await gitHubService.getTotalPRCount();

      expect(result).toBe(expectedCount);
      expect(mockRepository.getTotalPRCount).toHaveBeenCalled();
    });

    it('should throw an AppError when getting total PR count fails', async () => {
      mockRepository.getTotalPRCount.mockRejectedValue(new Error('DB Error'));

      await expect(gitHubService.getTotalPRCount()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting total PR count:',
        expect.any(Error),
      );
    });
  });

  describe('resetData', () => {
    it('should reset GitHub data successfully', async () => {
      mockRepository.deleteAllMetrics.mockResolvedValue(undefined);
      mockRepository.resetProcessedFlags.mockResolvedValue(undefined);
      mockRepository.getTotalPRCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);

      await gitHubService.resetData();

      expect(mockRepository.deleteAllMetrics).toHaveBeenCalled();
      expect(mockRepository.resetProcessedFlags).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Before reset: 10 metrics');
      expect(mockLogger.info).toHaveBeenCalledWith('After reset: 0 metrics');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reset GitHub data successfully',
      );
    });

    it('should throw an AppError when reset fails due to remaining metrics', async () => {
      mockRepository.deleteAllMetrics.mockResolvedValue(undefined);
      mockRepository.resetProcessedFlags.mockResolvedValue(undefined);
      mockRepository.getTotalPRCount.mockResolvedValue(10); // Simulating metrics remaining after reset

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
      mockRepository.deleteAllMetrics.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(gitHubService.resetData()).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error resetting GitHub data:',
        expect.any(Error),
      );
    });

    it('should throw an AppError when resetProcessedFlags fails', async () => {
      mockRepository.deleteAllMetrics.mockResolvedValue(undefined);
      mockRepository.resetProcessedFlags.mockRejectedValue(
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
