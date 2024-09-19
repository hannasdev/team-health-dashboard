// src/services/MetricsService/MetricsService.test.ts
import { Container } from 'inversify';

import { MetricsService } from './MetricsService';
import {
  createMockLogger,
  createMockGitHubService,
  createMockGoogleSheetsService,
  createMockMetric,
} from '../../__mocks__';
import { TYPES } from '../../utils/types';

import type {
  ILogger,
  IGitHubService,
  IGoogleSheetsService,
} from '../../interfaces';

describe('MetricsService', () => {
  let container: Container;
  let metricsService: MetricsService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockGitHubService: jest.Mocked<IGitHubService>;
  let mockGoogleSheetsService: jest.Mocked<IGoogleSheetsService>;

  beforeEach(() => {
    container = new Container();
    mockLogger = createMockLogger();
    mockGitHubService = createMockGitHubService();
    mockGoogleSheetsService = createMockGoogleSheetsService();

    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IGitHubService>(TYPES.GitHubService)
      .toConstantValue(mockGitHubService);
    container
      .bind<IGoogleSheetsService>(TYPES.GoogleSheetsService)
      .toConstantValue(mockGoogleSheetsService);
    container.bind<MetricsService>(MetricsService).toSelf();

    metricsService = container.get<MetricsService>(MetricsService);
  });

  describe('getAllMetrics', () => {
    it('should fetch and combine metrics from both services', async () => {
      const mockGitHubMetrics = [
        createMockMetric({
          source: 'GitHub',
          timestamp: new Date('2023-01-02'),
        }),
      ];
      const mockGoogleSheetsMetrics = [
        createMockMetric({
          source: 'Google Sheets',
          timestamp: new Date('2023-01-01'),
        }),
      ];

      mockGitHubService.getProcessedMetrics.mockResolvedValue(
        mockGitHubMetrics,
      );
      mockGoogleSheetsService.getMetrics.mockResolvedValue(
        mockGoogleSheetsMetrics,
      );
      mockGitHubService.getTotalPRCount.mockResolvedValue(100);
      mockGoogleSheetsService.getTotalMetricsCount.mockResolvedValue(50);

      const result = await metricsService.getAllMetrics(1, 10);

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].source).toBe('GitHub');
      expect(result.metrics[1].source).toBe('Google Sheets');
      expect(result.githubStats).toEqual({
        totalPRs: 100,
        fetchedPRs: 1,
        timePeriod: 90,
      });
      expect(result.totalMetrics).toBe(150);
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockGitHubService.getProcessedMetrics.mockRejectedValue(error);

      await expect(metricsService.getAllMetrics(1, 10)).rejects.toThrow(
        'Failed to fetch metrics',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        error,
      );
    });
  });

  describe('fetchAndStoreAllData', () => {
    it('should fetch and store data from both services', async () => {
      await metricsService.fetchAndStoreAllData();

      expect(mockGitHubService.fetchAndStoreRawData).toHaveBeenCalledWith(90);
      expect(mockGoogleSheetsService.fetchAndStoreMetrics).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Raw data fetched and stored successfully',
      );
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockGitHubService.fetchAndStoreRawData.mockRejectedValue(error);

      await expect(metricsService.fetchAndStoreAllData()).rejects.toThrow(
        'Failed to fetch and store raw data',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching and storing raw data:',
        error,
      );
    });
  });

  describe('syncAllData', () => {
    it('should sync data from both services', async () => {
      await metricsService.syncAllData();

      expect(mockGitHubService.syncData).toHaveBeenCalledWith(90);
      expect(mockGoogleSheetsService.syncMetrics).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'All data synced successfully',
      );
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockGitHubService.syncData.mockRejectedValue(error);

      await expect(metricsService.syncAllData()).rejects.toThrow(
        'Failed to sync data',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error syncing data:',
        error,
      );
    });
  });

  // Test private method indirectly
  describe('combineAndSortMetrics (indirectly)', () => {
    it('should combine and sort metrics correctly', async () => {
      const mockGitHubMetrics = [
        createMockMetric({
          source: 'GitHub',
          timestamp: new Date('2023-01-03'),
        }),
        createMockMetric({
          source: 'GitHub',
          timestamp: new Date('2023-01-01'),
        }),
      ];
      const mockGoogleSheetsMetrics = [
        createMockMetric({
          source: 'Google Sheets',
          timestamp: new Date('2023-01-04'),
        }),
        createMockMetric({
          source: 'Google Sheets',
          timestamp: new Date('2023-01-02'),
        }),
      ];

      mockGitHubService.getProcessedMetrics.mockResolvedValue(
        mockGitHubMetrics,
      );
      mockGoogleSheetsService.getMetrics.mockResolvedValue(
        mockGoogleSheetsMetrics,
      );
      mockGitHubService.getTotalPRCount.mockResolvedValue(100);
      mockGoogleSheetsService.getTotalMetricsCount.mockResolvedValue(50);

      const result = await metricsService.getAllMetrics(1, 10);

      expect(result.metrics).toHaveLength(4);
      expect(result.metrics.map(m => m.source)).toEqual([
        'Google Sheets',
        'GitHub',
        'Google Sheets',
        'GitHub',
      ]);
      expect(result.metrics.map(m => m.timestamp)).toEqual([
        new Date('2023-01-04'),
        new Date('2023-01-03'),
        new Date('2023-01-02'),
        new Date('2023-01-01'),
      ]);
    });
  });
});
