// src/__tests__/services/metrics/MetricsService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import {
  createMockLogger,
  createMockGoogleSheetsService,
  createMockGitHubService,
  createMockMetric,
} from '@/__mocks__/mockFactories';
import type { IMetricsService, IMetric } from '@/interfaces';
import { MetricsService } from '@/services/metrics/MetricsService';
import { Logger } from '@/utils/Logger';

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsService: ReturnType<typeof createMockGoogleSheetsService>;
  let mockGitHubService: ReturnType<typeof createMockGitHubService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGoogleSheetsService = createMockGoogleSheetsService();
    mockGitHubService = createMockGitHubService();
    mockLogger = createMockLogger() as unknown as jest.Mocked<Logger>;
    metricsService = new MetricsService(
      mockGoogleSheetsService,
      mockGitHubService,
      mockLogger,
    );
  });

  describe('fetchData', () => {
    it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
      const mockSheetMetric = createMockMetric({
        id: 'sheet-metric',
        source: 'Google Sheets',
      });
      const mockGitHubMetric = createMockMetric({
        id: 'github-metric',
        source: 'GitHub',
      });

      const mockSheetMetrics: IMetric[] = [mockSheetMetric];
      const mockGitHubResult = {
        metrics: [mockGitHubMetric],
        totalPRs: 10,
        fetchedPRs: 10,
        timePeriod: 90,
      };

      mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
      mockGitHubService.fetchData.mockResolvedValue(mockGitHubResult);

      const mockProgressCallback = jest.fn();

      const result = await metricsService.getAllMetrics(mockProgressCallback);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics).toEqual(
        expect.arrayContaining([mockSheetMetric, mockGitHubMetric]),
      );
      expect(result.errors).toHaveLength(0);
      expect(result.githubStats).toEqual({
        totalPRs: 10,
        fetchedPRs: 10,
        timePeriod: 90,
      });

      // Check if progress callback was called
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
    });

    it('should handle errors from Google Sheets service', async () => {
      mockGoogleSheetsService.fetchData.mockRejectedValue(
        new Error('Google Sheets API error'),
      );
      mockGitHubService.fetchData.mockResolvedValue({
        metrics: [],
        totalPRs: 0,
        fetchedPRs: 0,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        source: 'Google Sheets',
        message: 'Google Sheets API error',
      });
    });

    it('should handle errors from GitHub service', async () => {
      mockGoogleSheetsService.fetchData.mockResolvedValue([]);
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        source: 'GitHub',
        message: 'GitHub API error',
      });
    });

    it('should handle errors from both services with progress updates', async () => {
      mockGoogleSheetsService.fetchData.mockRejectedValue(
        new Error('Google Sheets API error'),
      );
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
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

      expect(mockProgressCallback).toHaveBeenCalledWith(
        0,
        100,
        'Google Sheets: Starting to fetch data',
      );
      expect(mockProgressCallback).toHaveBeenCalledWith(
        50,
        100,
        'GitHub: Starting to fetch data',
      );
    });

    it('should log errors from services', async () => {
      const googleSheetsError = new Error('Google Sheets API error');
      const gitHubError = new Error('GitHub API error');

      mockGoogleSheetsService.fetchData.mockRejectedValue(googleSheetsError);
      mockGitHubService.fetchData.mockRejectedValue(gitHubError);

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

    it('should deduplicate metrics from different sources', async () => {
      const sheetMetric = {
        id: 'metric-1',
        metric_category: 'Test Category',
        metric_name: 'Test Metric',
        value: 10,
        timestamp: new Date(2023, 0, 1),
        unit: 'count',
        additional_info: 'Sheet info',
        source: 'Google Sheets',
      };

      const githubMetric = {
        ...sheetMetric,
        value: 20,
        timestamp: new Date(2023, 0, 2),
        additional_info: 'GitHub info',
        source: 'GitHub',
      };

      mockGoogleSheetsService.fetchData.mockResolvedValue([sheetMetric]);
      mockGitHubService.fetchData.mockResolvedValue({
        metrics: [githubMetric],
        totalPRs: 1,
        fetchedPRs: 1,
        timePeriod: 90,
      });

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0]).toEqual(githubMetric); // The GitHub metric should be chosen as it has a later timestamp
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
      mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
      mockGitHubService.fetchData.mockRejectedValue(
        new Error('GitHub API error'),
      );

      const result = await metricsService.getAllMetrics();

      expect(result.metrics).toEqual(mockSheetMetrics);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].source).toBe('GitHub');
    });

    it.each([
      [new Date(2023, 0, 1), new Date(2023, 0, 2), 'GitHub'],
      [new Date(2023, 0, 2), new Date(2023, 0, 1), 'Google Sheets'],
    ])(
      'should choose metric with latest timestamp when deduplicating',
      async (date1, date2, expectedSource) => {
        const sheetMetric: IMetric = {
          id: 'metric-1',
          metric_category: 'Test Category',
          metric_name: 'Test Metric',
          value: 10,
          timestamp: date1,
          unit: 'count',
          additional_info: 'Test info',
          source: 'Google Sheets',
        };
        const githubMetric: IMetric = {
          ...sheetMetric,
          timestamp: date2,
          source: 'GitHub',
        };

        mockGoogleSheetsService.fetchData.mockResolvedValue([sheetMetric]);
        mockGitHubService.fetchData.mockResolvedValue({
          metrics: [githubMetric],
          totalPRs: 1,
          fetchedPRs: 1,
          timePeriod: 90,
        });

        const result = await metricsService.getAllMetrics();

        expect(result.metrics).toHaveLength(1);
        expect(result.metrics[0].source).toBe(expectedSource);
      },
    );

    it('should handle timeouts gracefully', async () => {
      jest.useFakeTimers();
      const timeoutError = new Error('Timeout');

      mockGoogleSheetsService.fetchData.mockRejectedValue(timeoutError);
      mockGitHubService.fetchData.mockRejectedValue(timeoutError);

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
