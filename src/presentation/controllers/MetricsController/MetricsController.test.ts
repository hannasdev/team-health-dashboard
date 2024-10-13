// src/presentation/controllers/MetricsController/MetricsController.test.ts

import { Container } from 'inversify';

import { MetricsController } from './MetricsController';
import {
  createMockLogger,
  createMockMetricsService,
  createMockApiResponse,
  createMockMetricsRequest,
  createMockResponse,
  createMockMetric,
} from '../../../__mocks__';
import { AppError } from '../../../utils/errors';
import { TYPES } from '../../../utils/types';

import type {
  ILogger,
  IMetricsService,
  IApiResponse,
  IMetric,
} from '../../../interfaces';

describe('MetricsController', () => {
  let container: Container;
  let metricsController: MetricsController;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockApiResponse: jest.Mocked<IApiResponse>;

  beforeEach(() => {
    container = new Container();
    mockLogger = createMockLogger();
    mockMetricsService = createMockMetricsService();
    mockApiResponse = createMockApiResponse();

    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IMetricsService>(TYPES.MetricsService)
      .toConstantValue(mockMetricsService);
    container
      .bind<IApiResponse>(TYPES.ApiResponse)
      .toConstantValue(mockApiResponse);
    container.bind<MetricsController>(MetricsController).toSelf();

    metricsController = container.get<MetricsController>(MetricsController);
  });

  describe('getAllMetrics', () => {
    it('should fetch metrics and return them as a response', async () => {
      const mockRequest = createMockMetricsRequest({
        query: { page: '2', pageSize: '15', timePeriod: '30' },
      });
      const mockResponse = createMockResponse();
      const mockNext = jest.fn();

      const mockMetrics: IMetric[] = [createMockMetric()];
      const mockResult = {
        metrics: mockMetrics,
        githubStats: { totalPRs: 100, fetchedPRs: 50, timePeriod: 30 },
        totalMetrics: 100,
      };

      mockMetricsService.getAllMetrics.mockResolvedValue(mockResult);
      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: mockResult,
      });

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(2, 15, 30);
      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith(
        mockResult,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and pass them to next middleware', async () => {
      const mockRequest = createMockMetricsRequest();
      const mockResponse = createMockResponse();
      const mockNext = jest.fn();

      const error = new Error('Test error');
      mockMetricsService.getAllMetrics.mockRejectedValue(error);

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        error,
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].message).toBe('Failed to fetch metrics');
    });
  });

  describe('syncMetrics', () => {
    it('should sync metrics and return a success response', async () => {
      const mockRequest = createMockMetricsRequest();
      const mockResponse = createMockResponse();
      const mockNext = jest.fn();

      mockMetricsService.syncAllData.mockResolvedValue(undefined);
      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: { message: 'Metrics synced successfully' },
      });

      await metricsController.syncMetrics(mockRequest, mockResponse, mockNext);

      expect(mockMetricsService.syncAllData).toHaveBeenCalled();
      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith({
        message: 'Metrics synced successfully',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Metrics synced successfully' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors during sync and pass them to next middleware', async () => {
      const mockRequest = createMockMetricsRequest();
      const mockResponse = createMockResponse();
      const mockNext = jest.fn();

      const error = new Error('Sync error');
      mockMetricsService.syncAllData.mockRejectedValue(error);

      await metricsController.syncMetrics(mockRequest, mockResponse, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error syncing metrics:',
        error,
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].message).toBe('Failed to sync metrics');
    });
  });
});
