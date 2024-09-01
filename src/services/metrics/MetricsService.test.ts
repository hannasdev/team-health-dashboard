// src/__tests__/services/metrics/MetricsService.test.ts
import { ProgressCallback } from 'types/index.js';

import {
  createMockLogger,
  createMockMetric,
  createMockGoogleSheetsRepository,
  createMockGitHubRepository,
  createMockPullRequest,
  createMockMetricCalculator,
} from '../../__mocks__/index.js';
import { MetricsService } from '../../services/metrics/MetricsService.js';
import { AppError } from '../../utils/errors.js';

import type {
  IMetricCalculator,
  IMetricsService,
  IMetric,
  ILogger,
} from '../../interfaces/index.js';

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsRepository: ReturnType<
    typeof createMockGoogleSheetsRepository
  >;
  let mockGitHubRepository: ReturnType<typeof createMockGitHubRepository>;
  let mockLogger: ILogger;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGoogleSheetsRepository = createMockGoogleSheetsRepository();
    mockGitHubRepository = createMockGitHubRepository();
    mockLogger = createMockLogger();
    mockMetricCalculator = createMockMetricCalculator();
    metricsService = new MetricsService(
      mockGoogleSheetsRepository,
      mockGitHubRepository,
      mockLogger,
      mockMetricCalculator,
    );
  });

  describe('fetchData', () => {
    it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
      const mockSheetMetrics = [createMockMetric({ source: 'Google Sheets' })];
      const mockGitHubResult = {
        pullRequests: [createMockPullRequest()],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 90,
      };

      mockGoogleSheetsRepository.fetchMetrics.mockImplementation(
        async (progressCallback?: ProgressCallback) => {
          progressCallback?.(0, 100, 'Starting Google Sheets fetch');
          progressCallback?.(100, 100, 'Finished Google Sheets fetch');
          return mockSheetMetrics;
        },
      );

      mockGitHubRepository.fetchPullRequests.mockImplementation(
        async (timePeriod: number, progressCallback?: ProgressCallback) => {
          progressCallback?.(0, 100, 'Starting GitHub fetch');
          progressCallback?.(100, 100, 'Finished GitHub fetch');
          return mockGitHubResult;
        },
      );

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics.length).toBe(4); // 1 from Google Sheets + 3 from GitHub
      expect(result.errors).toHaveLength(0);
      expect(result.githubStats).toEqual(
        expect.objectContaining({
          totalPRs: expect.any(Number),
          fetchedPRs: expect.any(Number),
          timePeriod: expect.any(Number),
        }),
      );

      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(
        mockGitHubResult.pullRequests,
      );

      // Check that the progress callback was called
      expect(mockProgressCallback).toHaveBeenCalledTimes(4);
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        1,
        0,
        100,
        'Google Sheets: Starting Google Sheets fetch',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        2,
        50,
        100,
        'Google Sheets: Finished Google Sheets fetch',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        3,
        50,
        100,
        'GitHub: Starting GitHub fetch',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        4,
        100,
        100,
        'GitHub: Finished GitHub fetch',
      );
    });

    it('should handle errors from Google Sheets repository', async () => {
      mockGoogleSheetsRepository.fetchMetrics.mockRejectedValue(
        new Error('Google Sheets API error'),
      );
      mockGitHubRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics.length).toBeGreaterThan(0); // GitHub metrics should still be present
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('Google Sheets');
    });

    it('should handle errors from both repositories with progress updates', async () => {
      mockGoogleSheetsRepository.fetchMetrics.mockImplementation(
        async (progressCallback?: ProgressCallback) => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          throw new Error('Google Sheets API error');
        },
      );

      mockGitHubRepository.fetchPullRequests.mockImplementation(
        async (timePeriod: number, progressCallback?: ProgressCallback) => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          throw new Error('GitHub API error');
        },
      );

      const mockProgressCallback = jest.fn();

      await expect(
        metricsService.getAllMetrics(mockProgressCallback),
      ).rejects.toThrow(AppError);

      expect(mockProgressCallback).toHaveBeenCalledTimes(2);
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        1,
        0,
        100,
        'Google Sheets: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        2,
        50,
        100,
        'GitHub: Starting to fetch data',
      );
    });

    it('should log errors from services', async () => {
      const googleSheetsError = new Error('Google Sheets API error');
      const gitHubError = new Error('GitHub API error');

      mockGoogleSheetsRepository.fetchMetrics.mockRejectedValue(
        googleSheetsError,
      );
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(gitHubError);

      await expect(metricsService.getAllMetrics()).rejects.toThrow(AppError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching Google Sheets data:',
        googleSheetsError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        gitHubError,
      );
    });

    it('should return partial data when only one data source fails', async () => {
      const mockSheetMetrics = [createMockMetric()];
      mockGoogleSheetsRepository.fetchMetrics.mockResolvedValue(
        mockSheetMetrics,
      );
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toEqual(mockSheetMetrics);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('GitHub');
    });

    it('should not deduplicate metrics from different sources', async () => {
      const sheetMetric = createMockMetric({
        id: 'metric-1',
        source: 'Google Sheets',
      });

      mockGoogleSheetsRepository.fetchMetrics.mockResolvedValue([sheetMetric]);
      mockGitHubRepository.fetchPullRequests.mockResolvedValue({
        pullRequests: [createMockPullRequest()],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics.length).toBe(4); // 1 from Google Sheets + 3 from GitHub
      expect(result.metrics).toContainEqual(
        expect.objectContaining({ source: 'Google Sheets' }),
      );
      expect(result.metrics.filter(m => m.source === 'GitHub').length).toBe(3);
    });

    it("should handle case where one service returns data and the other doesn't", async () => {
      const mockSheetMetrics: IMetric[] = [
        {
          id: 'sheet-1',
          metric_category: 'Test Category',
          metric_name: 'Test Metric',
          value: 10,
          timestamp: new Date(),
          unit: 'count',
          additional_info: 'Test info',
          source: 'Google Sheets',
        },
      ];
      mockGoogleSheetsRepository.fetchMetrics.mockResolvedValue(
        mockSheetMetrics,
      );
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toEqual(mockSheetMetrics);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('GitHub');
    });

    it.each([
      [new Date(2023, 0, 1), new Date(2023, 0, 2)],
      [new Date(2023, 0, 2), new Date(2023, 0, 1)],
    ])(
      'should not deduplicate metrics with different timestamps',
      async date1 => {
        const sheetMetric = createMockMetric({
          id: 'metric-1',
          source: 'Google Sheets',
          timestamp: date1,
        });

        mockGoogleSheetsRepository.fetchMetrics.mockResolvedValue([
          sheetMetric,
        ]);
        mockGitHubRepository.fetchPullRequests.mockResolvedValue({
          pullRequests: [createMockPullRequest()],
          totalPRs: 1,
          fetchedPRs: 1,
          timePeriod: 90,
        });

        const result = await metricsService.getAllMetrics();

        expect(result.metrics.length).toBe(4);
        expect(result.metrics).toContainEqual(
          expect.objectContaining({ source: 'Google Sheets' }),
        );
        expect(result.metrics.filter(m => m.source === 'GitHub').length).toBe(
          3,
        );
      },
    );

    it('should handle timeouts gracefully', async () => {
      jest.useFakeTimers();
      const timeoutError = new Error('Timeout');

      mockGoogleSheetsRepository.fetchMetrics.mockRejectedValue(timeoutError);
      mockGitHubRepository.fetchPullRequests.mockRejectedValue(timeoutError);

      const getAllMetricsPromise = metricsService.getAllMetrics();

      jest.runAllTimers();

      await expect(getAllMetricsPromise).rejects.toThrow(AppError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching Google Sheets data:',
        timeoutError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        timeoutError,
      );

      jest.useRealTimers();
    });
  });
});
