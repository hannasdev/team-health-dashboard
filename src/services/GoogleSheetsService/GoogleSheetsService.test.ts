// src/services/GoogleSheetsService/GoogleSheetsService.test.ts

import { Container } from 'inversify';

import { GoogleSheetsService } from './GoogleSheetsService';
import {
  createMockLogger,
  createMockCacheService,
  createMockGoogleSheetsRepository,
  createMockMetricCalculator,
  createMockMetric,
} from '../../__mocks__';
import { TYPES } from '../../utils/types';

import type {
  ILogger,
  ICacheService,
  IGoogleSheetsRepository,
  IMetricCalculator,
} from '../../interfaces';

describe('GoogleSheetsService', () => {
  let container: Container;
  let googleSheetsService: GoogleSheetsService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockRepository: jest.Mocked<IGoogleSheetsRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;

  beforeEach(() => {
    container = new Container();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockRepository = createMockGoogleSheetsRepository();
    mockMetricCalculator = createMockMetricCalculator();

    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    container
      .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
      .toConstantValue(mockRepository);
    container
      .bind<IMetricCalculator>(TYPES.MetricCalculator)
      .toConstantValue(mockMetricCalculator);
    container.bind<GoogleSheetsService>(GoogleSheetsService).toSelf();

    googleSheetsService =
      container.get<GoogleSheetsService>(GoogleSheetsService);
  });

  describe('fetchRawData', () => {
    it('should fetch raw data from the repository', async () => {
      const mockRawData = [
        ['header1', 'header2'],
        ['data1', 'data2'],
      ];
      mockRepository.fetchRawData.mockResolvedValue(mockRawData);

      const result = await googleSheetsService.fetchRawData();

      expect(mockRepository.fetchRawData).toHaveBeenCalled();
      expect(result).toEqual(mockRawData);
    });
  });

  describe('fetchAndStoreMetrics', () => {
    it('should fetch, process, and store metrics', async () => {
      const mockRawData = [
        ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Info'],
        [
          '2023-01-01',
          'TestCategory',
          'TestMetric',
          '10',
          'count',
          'Additional Info',
        ],
      ];
      const mockProcessedMetric = createMockMetric();
      mockRepository.fetchRawData.mockResolvedValue(mockRawData);
      mockMetricCalculator.calculateMetrics.mockReturnValue([
        mockProcessedMetric,
      ]);

      await googleSheetsService.fetchAndStoreMetrics();

      expect(mockRepository.fetchRawData).toHaveBeenCalled();
      expect(mockRepository.storeMetrics).toHaveBeenCalledWith([
        mockProcessedMetric,
      ]);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetched and stored 1 metrics'),
      );
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Test error');
      mockRepository.fetchRawData.mockRejectedValue(error);

      await expect(googleSheetsService.fetchAndStoreMetrics()).rejects.toThrow(
        'Failed to fetch and store Google Sheets data',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching and storing Google Sheets data:',
        error,
      );
    });
  });

  describe('getMetrics', () => {
    it('should retrieve metrics from the repository', async () => {
      const mockMetrics = [createMockMetric(), createMockMetric()];
      mockRepository.getMetrics.mockResolvedValue(mockMetrics);

      const result = await googleSheetsService.getMetrics(1, 10);

      expect(mockRepository.getMetrics).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('syncMetrics', () => {
    it('should call fetchAndStoreMetrics', async () => {
      const spy = jest
        .spyOn(googleSheetsService, 'fetchAndStoreMetrics')
        .mockResolvedValue();

      await googleSheetsService.syncMetrics();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getTotalMetricsCount', () => {
    it('should return the total count of metrics from the repository', async () => {
      const mockCount = 42;
      mockRepository.getTotalMetricsCount.mockResolvedValue(mockCount);

      const result = await googleSheetsService.getTotalMetricsCount();

      expect(mockRepository.getTotalMetricsCount).toHaveBeenCalled();
      expect(result).toBe(mockCount);
    });
  });

  // Test private methods indirectly through public methods
  describe('processRawData (indirectly)', () => {
    it('should process raw data correctly', async () => {
      const mockRawData = [
        ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Info'],
        [
          '2023-01-01',
          'TestCategory',
          'TestMetric',
          '10',
          'count',
          'Additional Info',
        ],
      ];
      const mockProcessedMetric = createMockMetric();
      mockRepository.fetchRawData.mockResolvedValue(mockRawData);
      mockMetricCalculator.calculateMetrics.mockReturnValue([
        mockProcessedMetric,
      ]);

      await googleSheetsService.fetchAndStoreMetrics();

      expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith([
        expect.objectContaining({
          metric_category: 'TestCategory',
          metric_name: 'TestMetric',
          value: 10,
          unit: 'count',
          additional_info: 'Additional Info',
          source: 'Google Sheets',
        }),
      ]);
    });

    it('should handle invalid rows', async () => {
      const mockRawData = [
        ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Info'],
        [
          '2023-01-01',
          'TestCategory',
          'TestMetric',
          '10',
          'count',
          'Additional Info',
        ],
        ['InvalidRow'],
      ];
      mockRepository.fetchRawData.mockResolvedValue(mockRawData);
      mockMetricCalculator.calculateMetrics.mockReturnValue([]);

      await googleSheetsService.fetchAndStoreMetrics();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping row with insufficient data'),
      );
    });
  });
});
