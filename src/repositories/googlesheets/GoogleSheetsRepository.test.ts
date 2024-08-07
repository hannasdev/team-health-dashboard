import 'reflect-metadata';
import {
  createMockLogger,
  createMockCacheService,
  createMockConfig,
  createMockGoogleSheetsClient,
} from '@/__mocks__/mockFactories';
import type {
  IGoogleSheetsClient,
  IConfig,
  IMetric,
  ILogger,
} from '@/interfaces';

import { GoogleSheetsRepository } from './GoogleSheetsRepository';

jest.mock('@/config/config', () => ({
  config: createMockConfig(),
}));

describe('GoogleSheetsRepository', () => {
  let repository: GoogleSheetsRepository;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockConfig: IConfig;
  let mockLogger: ILogger;
  let mockCacheService: ReturnType<typeof createMockCacheService>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGoogleSheetsClient = createMockGoogleSheetsClient();
    mockConfig = createMockConfig();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();

    repository = new GoogleSheetsRepository(
      mockGoogleSheetsClient,
      mockConfig,
      mockLogger,
      mockCacheService,
    );
  });

  describe('fetchMetrics', () => {
    it('should fetch and process metrics from Google Sheets', async () => {
      const mockSheetData = {
        data: {
          values: [
            [
              'Timestamp',
              'Category',
              'Name',
              'Value',
              'Unit',
              'Additional Info',
            ],
            [
              '2023-01-01',
              'Test Category',
              'Test Metric',
              '10',
              'count',
              'Test Info',
            ],
          ],
        },
      };

      mockGoogleSheetsClient.getValues.mockResolvedValue(mockSheetData);

      const result = await repository.fetchMetrics();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'sheet-0',
        metric_category: 'Test Category',
        metric_name: 'Test Metric',
        value: 10,
        timestamp: new Date('2023-01-01'),
        unit: 'count',
        additional_info: 'Test Info',
        source: 'Google Sheets',
      });
    });

    it('should handle empty sheet data', async () => {
      mockGoogleSheetsClient.getValues.mockResolvedValue({
        data: { values: [] },
      });

      const result = await repository.fetchMetrics();

      expect(result).toHaveLength(0);
    });

    it('should skip rows with insufficient data', async () => {
      const mockSheetData = {
        data: {
          values: [
            [
              'Timestamp',
              'Category',
              'Name',
              'Value',
              'Unit',
              'Additional Info',
            ],
            ['2023-01-01', 'Test Category', 'Test Metric'], // Insufficient data
            [
              '2023-01-02',
              'Valid Category',
              'Valid Metric',
              '20',
              'count',
              'Valid Info',
            ],
          ],
        },
      };

      mockGoogleSheetsClient.getValues.mockResolvedValue(mockSheetData);

      const result = await repository.fetchMetrics();

      expect(result).toHaveLength(1);
      expect(result[0].metric_name).toBe('Valid Metric');
    });

    it('should handle errors when fetching data', async () => {
      mockGoogleSheetsClient.getValues.mockRejectedValue(
        new Error('API Error'),
      );

      await expect(repository.fetchMetrics()).rejects.toThrow(
        'Failed to fetch data from Google Sheets: API Error',
      );
    });

    it('should call progress callback if provided', async () => {
      const mockSheetData = {
        data: {
          values: [
            [
              'Timestamp',
              'Category',
              'Name',
              'Value',
              'Unit',
              'Additional Info',
            ],
            [
              '2023-01-01',
              'Test Category',
              'Test Metric',
              '10',
              'count',
              'Test Info',
            ],
          ],
        },
      };

      mockGoogleSheetsClient.getValues.mockResolvedValue(mockSheetData);

      const mockProgressCallback = jest.fn();

      await repository.fetchMetrics(mockProgressCallback);

      expect(mockProgressCallback).toHaveBeenCalledTimes(3);
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        1,
        0,
        100,
        'Starting to fetch data from Google Sheets',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        2,
        50,
        100,
        'Data fetched from Google Sheets, processing rows',
      );
      expect(mockProgressCallback).toHaveBeenNthCalledWith(
        3,
        100,
        100,
        'Finished processing Google Sheets data',
      );
    });

    it('should use cache when available', async () => {
      const cachedMetrics: IMetric[] = [
        {
          id: 'cached-metric',
          metric_category: 'Cached Category',
          metric_name: 'Cached Metric',
          value: 100,
          timestamp: new Date(),
          unit: 'count',
          additional_info: 'Cached Info',
          source: 'Google Sheets',
        },
      ];

      (mockCacheService.get as jest.Mock).mockResolvedValue(cachedMetrics);

      const result = await repository.fetchMetrics();

      expect(result).toEqual(cachedMetrics);
      expect(mockGoogleSheetsClient.getValues).not.toHaveBeenCalled();
    });

    it('should log errors when fetching fails', async () => {
      const error = new Error('API Error');
      mockGoogleSheetsClient.getValues.mockRejectedValue(error);

      await expect(repository.fetchMetrics()).rejects.toThrow(
        'Failed to fetch data from Google Sheets: API Error',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching data from Google Sheets:',
        error,
      );
    });
  });
});
