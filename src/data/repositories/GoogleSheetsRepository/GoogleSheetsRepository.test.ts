// src/__tests__/repositories/GoogleSheetsRepository.test.ts

import { Container } from 'inversify';
import { Types } from 'mongoose';

import { GoogleSheetsRepository } from './GoogleSheetsRepository';
import {
  createMockGoogleSheetsClient,
  createMockLogger,
  createMockConfig,
  createMockGoogleSheetsMetricModel,
  createMockMetric,
} from '../../../__mocks__/index';
import { GoogleSheetsMetricModel } from '../../../types/index';
import { AppError } from '../../../utils/errors';
import { TYPES } from '../../../utils/types';

import type {
  ILogger,
  IGoogleSheetsClient,
  IConfig,
} from '../../../interfaces/index';

describe('GoogleSheetsRepository', () => {
  let container: Container;
  let googleSheetsRepository: GoogleSheetsRepository;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockConfig: jest.Mocked<IConfig>;
  let mockGoogleSheetsMetricModel: jest.Mocked<GoogleSheetsMetricModel>;

  beforeEach(() => {
    container = new Container();
    mockGoogleSheetsClient = createMockGoogleSheetsClient();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    mockGoogleSheetsMetricModel = createMockGoogleSheetsMetricModel();

    container
      .bind(TYPES.GoogleSheetsClient)
      .toConstantValue(mockGoogleSheetsClient);
    container.bind(TYPES.Config).toConstantValue(mockConfig);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind(TYPES.GoogleSheetsMetricModel)
      .toConstantValue(mockGoogleSheetsMetricModel);
    container.bind(GoogleSheetsRepository).toSelf();

    googleSheetsRepository = container.get(GoogleSheetsRepository);
  });

  describe('fetchRawData', () => {
    it('should fetch data from Google Sheets successfully', async () => {
      const mockData = [
        ['header1', 'header2'],
        ['value1', 'value2'],
      ];
      mockGoogleSheetsClient.getValues.mockResolvedValue({
        data: { values: mockData },
      });

      const result = await googleSheetsRepository.fetchRawData();

      expect(result).toEqual(mockData);
      expect(mockGoogleSheetsClient.getValues).toHaveBeenCalledWith(
        mockConfig.GOOGLE_SHEETS_ID,
        'A:F',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting to fetch data from Google Sheets',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Data fetched from Google Sheets',
      );
    });

    it('should throw an AppError when fetching fails', async () => {
      mockGoogleSheetsClient.getValues.mockRejectedValue(
        new Error('API Error'),
      );

      await expect(googleSheetsRepository.fetchRawData()).rejects.toThrow(
        AppError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch data from Google Sheets:',
        expect.any(Error),
      );
    });
  });

  describe('storeMetrics', () => {
    it('should store metrics successfully', async () => {
      const mockMetrics = [createMockMetric(), createMockMetric()];
      mockGoogleSheetsMetricModel.insertMany.mockResolvedValue([]);

      await googleSheetsRepository.storeMetrics(mockMetrics);

      expect(mockGoogleSheetsMetricModel.insertMany).toHaveBeenCalledWith(
        mockMetrics.map(metric => ({
          metric_category: metric.metric_category,
          metric_name: metric.metric_name,
          value: metric.value,
          timestamp: metric.timestamp,
          unit: metric.unit,
          additional_info: metric.additional_info,
          source: metric.source,
        })),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Stored ${mockMetrics.length} metrics`,
      );
    });

    it('should throw an AppError when storing fails', async () => {
      const mockMetrics = [createMockMetric()];
      mockGoogleSheetsMetricModel.insertMany.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        googleSheetsRepository.storeMetrics(mockMetrics),
      ).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error storing metrics:',
        expect.any(Error),
      );
    });
  });

  describe('getMetrics', () => {
    it('should get metrics successfully', async () => {
      const mockMetrics = [
        { _id: new Types.ObjectId(), ...createMockMetric() },
        { _id: new Types.ObjectId(), ...createMockMetric() },
      ];
      mockGoogleSheetsMetricModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockMetrics),
      } as any);

      const result = await googleSheetsRepository.getMetrics(1, 20);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(mockMetrics[0]._id.toString());
      expect(mockGoogleSheetsMetricModel.find).toHaveBeenCalled();
    });

    it('should throw an AppError when fetching metrics fails', async () => {
      mockGoogleSheetsMetricModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB Error')),
      } as any);

      await expect(googleSheetsRepository.getMetrics()).rejects.toThrow(
        AppError,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics from database:',
        expect.any(Error),
      );
    });
  });

  describe('getTotalMetricsCount', () => {
    it('should get total metrics count successfully', async () => {
      mockGoogleSheetsMetricModel.countDocuments.mockResolvedValue(100);

      const result = await googleSheetsRepository.getTotalMetricsCount();

      expect(result).toBe(100);
      expect(mockGoogleSheetsMetricModel.countDocuments).toHaveBeenCalled();
    });

    it('should throw an AppError when counting metrics fails', async () => {
      mockGoogleSheetsMetricModel.countDocuments.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        googleSheetsRepository.getTotalMetricsCount(),
      ).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error counting metrics:',
        expect.any(Error),
      );
    });
  });

  describe('updateMetrics', () => {
    it('should update metrics successfully', async () => {
      const mockMetrics = [createMockMetric(), createMockMetric()];
      mockGoogleSheetsMetricModel.findOneAndUpdate.mockResolvedValue(null);

      await googleSheetsRepository.updateMetrics(mockMetrics);

      expect(
        mockGoogleSheetsMetricModel.findOneAndUpdate,
      ).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Updated ${mockMetrics.length} metrics`,
      );
    });

    it('should throw an AppError when updating metrics fails', async () => {
      const mockMetrics = [createMockMetric()];
      mockGoogleSheetsMetricModel.findOneAndUpdate.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        googleSheetsRepository.updateMetrics(mockMetrics),
      ).rejects.toThrow(AppError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating metrics:',
        expect.any(Error),
      );
    });
  });
});
