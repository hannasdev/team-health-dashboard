// src/__tests__/services/metrics/MetricsService.test.ts
import {
  createMockLogger,
  createMockMetric,
  createMockGoogleSheetsRepository,
  createMockGitHubRepository,
  createMockPullRequest,
} from '@/__mocks__/mockFactories';
import type { IMetricsService, IMetric } from '@/interfaces';
import { MetricsService } from '@/services/metrics/MetricsService';
import { Logger } from '@/utils/Logger';

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsRepository: ReturnType<
    typeof createMockGoogleSheetsRepository
  >;
  let mockGitHubRepository: ReturnType<typeof createMockGitHubRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGoogleSheetsRepository = createMockGoogleSheetsRepository();
    mockGitHubRepository = createMockGitHubRepository();
    mockLogger = createMockLogger() as jest.Mocked<Logger>;
    metricsService = new MetricsService(
      mockGoogleSheetsRepository,
      mockGitHubRepository,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
      const mockSheetMetrics = [createMockMetric()];
      const mockGitHubResult = {
        pullRequests: [createMockPullRequest()],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 90,
      };

      mockGoogleSheetsRepository.fetchMetrics.mockImplementation(
        async progressCallback => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          progressCallback?.(100, 100, 'Finished fetching data');
          return mockSheetMetrics;
        },
      );

      mockGitHubRepository.fetchPullRequests.mockImplementation(
        async (timePeriod, progressCallback) => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          progressCallback?.(100, 100, 'Finished fetching data');
          return mockGitHubResult;
        },
      );

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.githubStats).toEqual(
        expect.objectContaining({
          totalPRs: expect.any(Number),
          fetchedPRs: expect.any(Number),
          timePeriod: expect.any(Number),
        }),
      );

      expect(mockProgressCallback).toHaveBeenCalledTimes(4);
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
        'Google Sheets: Finished fetching data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        3,
        50,
        100,
        'GitHub: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        4,
        100,
        100,
        'GitHub: Finished fetching data',
      );

      expect(mockGoogleSheetsRepository.fetchMetrics).toHaveBeenCalled();
      expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalled();
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
        async progressCallback => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          throw new Error('Google Sheets API error');
        },
      );

      mockGitHubRepository.fetchPullRequests.mockImplementation(
        async (timePeriod, progressCallback) => {
          progressCallback?.(0, 100, 'Starting to fetch data');
          throw new Error('GitHub API error');
        },
      );

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          { source: 'Google Sheets', message: 'Google Sheets API error' },
          { source: 'GitHub', message: 'GitHub API error' },
        ]),
      );

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

      await metricsService.getAllMetrics();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching Google Sheets data:',
        googleSheetsError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching GitHub data:',
        gitHubError,
      );
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
      async (date1, date2) => {
        const sheetMetric = createMockMetric({
          id: 'metric-1',
          source: 'Google Sheets',
          timestamp: date1,
        });
        const githubMetrics = [
          createMockMetric({
            id: 'github-pr-count',
            source: 'GitHub',
            timestamp: date2,
          }),
          createMockMetric({
            id: 'github-avg-pr-size',
            source: 'GitHub',
            timestamp: date2,
          }),
          createMockMetric({
            id: 'github-avg-merge-time',
            source: 'GitHub',
            timestamp: date2,
          }),
        ];

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

      const result = await getAllMetricsPromise;

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toEqual({
        source: 'Google Sheets',
        message: 'Timeout',
      });
      expect(result.errors[1]).toEqual({
        source: 'GitHub',
        message: 'Timeout',
      });

      jest.useRealTimers();
    });
  });
});
