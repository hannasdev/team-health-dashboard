import { Container } from 'inversify';
import 'reflect-metadata';

import { ProcessingService } from './ProcessingService';
import {
  createMockGitHubRepository,
  createMockMetricCalculator,
  createMockLogger,
  createMockPullRequest,
  createMockMetric,
  createMockJobQueueService,
} from '../../__mocks__';
import { TYPES } from '../../utils/types';

import type {
  IGitHubRepository,
  IMetricCalculator,
  ILogger,
  IPullRequest,
  IMetric,
  IJobQueueService,
} from '../../interfaces';

describe('ProcessingService', () => {
  let container: Container;
  let processingService: ProcessingService;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockJobQueueService: jest.Mocked<IJobQueueService>;

  beforeEach(() => {
    container = new Container();
    mockGitHubRepository = createMockGitHubRepository();
    mockMetricCalculator = createMockMetricCalculator();
    mockLogger = createMockLogger();
    mockJobQueueService = createMockJobQueueService();

    container
      .bind<IGitHubRepository>(TYPES.GitHubRepository)
      .toConstantValue(mockGitHubRepository);
    container
      .bind<IMetricCalculator>(TYPES.MetricCalculator)
      .toConstantValue(mockMetricCalculator);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IJobQueueService>(TYPES.JobQueueService)
      .toConstantValue(mockJobQueueService);
    container.bind<ProcessingService>(ProcessingService).toSelf();

    processingService = container.get<ProcessingService>(ProcessingService);
  });

  describe('processGitHubData', () => {
    it('should schedule a job for processing GitHub data', async () => {
      await processingService.processGitHubData();

      expect(mockJobQueueService.scheduleJob).toHaveBeenCalledWith(
        'processGitHubData',
        {},
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled GitHub data processing job',
      );
    });

    it('should handle errors when scheduling fails', async () => {
      const error = new Error('Scheduling failed');
      mockJobQueueService.scheduleJob.mockRejectedValue(error);

      await expect(processingService.processGitHubData()).rejects.toThrow(
        'Failed to schedule GitHub data processing',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error scheduling GitHub data processing job:',
        error,
      );
    });
  });

  describe('processGitHubDataJob', () => {
    it('should handle empty pull requests', async () => {
      mockGitHubRepository.getRawPullRequests.mockResolvedValue([]);

      await processingService.processGitHubDataJob();

      expect(mockGitHubRepository.getRawPullRequests).toHaveBeenCalledTimes(1);
      expect(mockMetricCalculator.calculateMetrics).not.toHaveBeenCalled();
      expect(mockGitHubRepository.storeProcessedMetrics).not.toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Finished processing all GitHub data',
      );
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockGitHubRepository.getRawPullRequests.mockRejectedValue(error);

      await expect(processingService.processGitHubDataJob()).rejects.toThrow(
        'Failed to process GitHub data',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in GitHub data processing job:',
        error,
      );
    });

    it('should process multiple pages of pull requests', async () => {
      const mockPullRequests1: IPullRequest[] = Array(100).fill(
        createMockPullRequest({ number: 1 }),
      );
      const mockPullRequests2: IPullRequest[] = Array(50).fill(
        createMockPullRequest({ number: 2 }),
      );
      const mockMetrics: IMetric[] = [createMockMetric({ _id: 'metric1' })];

      mockGitHubRepository.getRawPullRequests
        .mockResolvedValueOnce(mockPullRequests1)
        .mockResolvedValueOnce(mockPullRequests2)
        .mockResolvedValueOnce([]);
      mockMetricCalculator.calculateMetrics.mockReturnValue(mockMetrics);

      await processingService.processGitHubDataJob();

      expect(mockGitHubRepository.getRawPullRequests).toHaveBeenCalledTimes(3);
      expect(mockGitHubRepository.getRawPullRequests).toHaveBeenNthCalledWith(
        1,
        1,
        100,
      );
      expect(mockGitHubRepository.getRawPullRequests).toHaveBeenNthCalledWith(
        2,
        2,
        100,
      );
      expect(mockGitHubRepository.getRawPullRequests).toHaveBeenNthCalledWith(
        3,
        3,
        100,
      );

      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledTimes(2);
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([expect.objectContaining({ number: 1 })]),
      );
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([expect.objectContaining({ number: 2 })]),
      );

      expect(mockGitHubRepository.storeProcessedMetrics).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockGitHubRepository.storeProcessedMetrics,
      ).toHaveBeenNthCalledWith(1, mockMetrics);
      expect(
        mockGitHubRepository.storeProcessedMetrics,
      ).toHaveBeenNthCalledWith(2, mockMetrics);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Finished processing all GitHub data',
      );
    });
  });
});
