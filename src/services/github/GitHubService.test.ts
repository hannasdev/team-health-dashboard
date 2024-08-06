import { createMockPullRequest } from '@/__mocks__/mockFactories';
import type {
  IGitHubRepository,
  IMetricCalculator,
  IProgressTracker,
  IMetric,
} from '@/interfaces';
import { GitHubService } from '@/services/github/GitHubService';
import { Logger } from '@/utils/Logger';

describe('GitHubService', () => {
  let gitHubService: GitHubService;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;
  let mockProgressTracker: jest.Mocked<IProgressTracker>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockGitHubRepository = {
      fetchPullRequests: jest.fn(),
    } as unknown as jest.Mocked<IGitHubRepository>;

    mockMetricCalculator = {
      calculateMetrics: jest.fn(),
    } as unknown as jest.Mocked<IMetricCalculator>;

    mockProgressTracker = {
      trackProgress: jest.fn(),
    } as unknown as jest.Mocked<IProgressTracker>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    gitHubService = new GitHubService(
      mockGitHubRepository,
      mockMetricCalculator,
      mockProgressTracker,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch pull requests and calculate metrics', async () => {
      const mockPRs = [createMockPullRequest(), createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: mockPRs,
        totalPRs: mockPRs.length,
        fetchedPRs: mockPRs.length,
        timePeriod: 90,
      });
      mockMetricCalculator.calculateMetrics.mockReturnValue([
        { id: 'test-metric', value: 42 } as IMetric,
      ]);

      const result = await gitHubService.fetchData();

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
        90,
        expect.any(Function),
      );
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        mockPRs,
      );
      expect(result).toEqual({
        metrics: [{ id: 'test-metric', value: 42 }],
        totalPRs: 2,
        fetchedPRs: 2,
        timePeriod: 90,
      });
    });

    it('should fetch data with custom time period', async () => {
      const customTimePeriod = 30;
      const mockPRs = [createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: mockPRs,
        totalPRs: mockPRs.length,
        fetchedPRs: mockPRs.length,
        timePeriod: customTimePeriod,
      });
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await gitHubService.fetchData(undefined, customTimePeriod);

      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
        customTimePeriod,
        expect.any(Function),
      );
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        expect.arrayContaining(mockPRs),
      );
      expect(result.timePeriod).toBe(customTimePeriod);
    });

    it('should use progress tracker and progress callback when provided', async () => {
      const progressCallback = jest.fn();
      const mockPullRequests = [createMockPullRequest()];
      mockGitHubRepository.fetchPullRequests.mockImplementation(
        async (timePeriod, callback) => {
          // Simulate progress updates
          if (callback) {
            callback(1, 2, 'Fetching PR 1');
            callback(2, 2, 'Fetching PR 2');
          }
          return {
            pullRequests: mockPullRequests,
            totalPRs: mockPullRequests.length,
            fetchedPRs: mockPullRequests.length,
            timePeriod,
          };
        },
      );

      await gitHubService.fetchData(progressCallback);

      // Check if the progress tracker was called
      expect(mockProgressTracker.trackProgress).toHaveBeenCalledTimes(2);
      expect(mockProgressTracker.trackProgress).toHaveBeenCalledWith(
        1,
        2,
        'Fetching PR 1',
      );
      expect(mockProgressTracker.trackProgress).toHaveBeenCalledWith(
        2,
        2,
        'Fetching PR 2',
      );

      // Check if the progress callback was called
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'Fetching PR 1');
      expect(progressCallback).toHaveBeenCalledWith(2, 2, 'Fetching PR 2');

      // Check if the metric calculator was called
      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        mockPullRequests,
      );
    });

    it('should handle errors during fetch', async () => {
      const errorMessage = 'API Error';
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(gitHubService.fetchData()).rejects.toThrow(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        expect.any(Error),
      );
      expect(mockMetricCalculator.calculateMetrics).not.toHaveBeenCalled();
    });

    it('should handle empty pull requests', async () => {
      mockGitHubRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      const result = await gitHubService.fetchData();

      expect(result).toEqual({
        metrics: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });
    });
  });
});
