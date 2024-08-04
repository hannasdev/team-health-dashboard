import {
  createMockGitHubRepository,
  createMockMetricCalculator,
  createMockLogger,
  createMockPullRequest,
} from '@/__mocks__/mockFactories';
import type {
  IGitHubRepository,
  IGitHubService,
  IMetricCalculator,
  IProgressTracker,
} from '@/interfaces';
import { GitHubService } from '@/services/github/GitHubService';
import { Logger } from '@/utils/Logger';

describe('GitHubService', () => {
  let service: IGitHubService;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;
  let mockProgressTracker: jest.Mocked<IProgressTracker>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockGitHubRepository = createMockGitHubRepository();
    mockMetricCalculator = createMockMetricCalculator();
    mockProgressTracker = {
      setReportInterval: jest.fn(),
      trackProgress: jest.fn(),
    };
    mockLogger = createMockLogger() as unknown as jest.Mocked<Logger>;

    service = new GitHubService(
      mockGitHubRepository,
      mockMetricCalculator,
      mockProgressTracker,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch pull requests and calculate metrics', async () => {
      const mockPRs = [createMockPullRequest(), createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue(mockPRs);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData();

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(90);
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        expect.arrayContaining(mockPRs),
      );
      expect(result.timePeriod).toBe(90); // Default time period
    });

    it('should fetch data with custom time period', async () => {
      const customTimePeriod = 30;
      const mockPRs = [createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue(mockPRs);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData(undefined, customTimePeriod);

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
        customTimePeriod,
      );
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        expect.arrayContaining(mockPRs),
      );
      expect(result.timePeriod).toBe(customTimePeriod);
    });

    it('should use progress callback when provided', async () => {
      const progressCallback = jest.fn();
      mockGitHubRepository.fetchPullRequests.mockResolvedValue([
        createMockPullRequest(),
      ]);

      await service.fetchData(progressCallback);

      expect(mockProgressTracker.setReportInterval).toHaveBeenCalled();
      expect(mockProgressTracker.trackProgress).toHaveBeenCalled();
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalled();

      // Check if the progress callback was used
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle errors during fetch', async () => {
      const errorMessage = 'API Error';
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.fetchData()).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        expect.any(Error),
      );
      expect(mockMetricCalculator.calculateMetrics).not.toHaveBeenCalled();
    });

    it('should handle empty pull request result', async () => {
      mockGitHubRepository.fetchPullRequests.mockResolvedValue([]);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await service.fetchData();

      expect(result).toEqual({
        metrics: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith([]);
    });

    // it('should fetch multiple pages of pull requests', async () => {
    //   const mockPRs1: IPullRequest[] = [
    //     createMockPullRequest(),
    //     createMockPullRequest(),
    //   ];
    //   const mockPRs2: IPullRequest[] = [createMockPullRequest()];
    //   mockRepository.fetchPullRequests
    //     .mockResolvedValueOnce(mockPRs1)
    //     .mockResolvedValueOnce(mockPRs2)
    //     .mockResolvedValueOnce([]);

    //   const result = await service.fetchData();

    //   expect(result.totalPRs).toBe(3);
    //   expect(result.fetchedPRs).toBe(3);
    //   expect(mockRepository.fetchPullRequests).toHaveBeenCalledTimes(1);
    // });
  });
});
