// src/presentation/controllers/MetricsController/MetricsController.test.ts

import { Container } from 'inversify';
import { ParsedQs } from 'qs';

import { MetricsController } from './MetricsController';
import {
  createMockLogger,
  createMockMetricsService,
  createMockApiResponse,
  createMockResponse,
  createMockMetric,
  createMockAuthenticatedRequest,
} from '../../../__mocks__';
import { AppError } from '../../../utils/errors';
import { TYPES } from '../../../utils/types';

import type {
  ILogger,
  IMetricsService,
  IApiResponse,
  IEnhancedResponse,
  IAuthenticatedRequest,
} from '../../../interfaces';

describe('MetricsController', () => {
  let container: Container;
  let metricsController: MetricsController;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockApiResponse: jest.Mocked<IApiResponse>;
  let mockRequest: jest.Mocked<IAuthenticatedRequest>;
  let mockResponse: jest.Mocked<IEnhancedResponse>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Set up DI container and mocks
    container = new Container();
    mockLogger = createMockLogger();
    mockMetricsService = createMockMetricsService();
    mockApiResponse = createMockApiResponse();
    mockNext = jest.fn();

    // Set up mock request and response
    mockRequest = createMockAuthenticatedRequest();
    mockResponse = createMockResponse();

    // Container bindings
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IMetricsService>(TYPES.MetricsService)
      .toConstantValue(mockMetricsService);
    container
      .bind<IApiResponse>(TYPES.ApiResponse)
      .toConstantValue(mockApiResponse);
    container.bind<MetricsController>(MetricsController).toSelf();

    metricsController = container.get<MetricsController>(MetricsController);

    // Default successful response setup
    const mockResult = {
      metrics: [createMockMetric()],
      githubStats: { totalPRs: 100, fetchedPRs: 50, timePeriod: 90 },
    };
    mockMetricsService.getAllMetrics.mockResolvedValue(mockResult);
    mockApiResponse.createSuccessResponse.mockReturnValue({
      success: true,
      data: mockResult,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Interface Contract', () => {
    it('should successfully retrieve metrics and return response', async () => {
      mockRequest.query = { page: '1', pageSize: '20' } as unknown as ParsedQs;

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        }),
      );
    });

    it('should handle errors using next middleware', async () => {
      mockMetricsService.getAllMetrics.mockRejectedValue(
        new Error('Service error'),
      );

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Metrics Retrieval', () => {
    describe('getAllMetrics', () => {
      it('should correctly parse and use valid pagination parameters', async () => {
        mockRequest.query = {
          page: '2',
          pageSize: '15',
        } as unknown as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(2, 15);
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Fetching metrics for page 2'),
        );
      });

      it('should use default pagination when parameters are missing', async () => {
        mockRequest.query = {} as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(1, 20);
      });

      it('should handle non-numeric page parameter', async () => {
        mockRequest.query = {
          page: 'invalid',
          pageSize: '20',
        } as unknown as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: 'Invalid pagination parameters',
          }),
        );
      });

      it('should handle non-numeric pageSize parameter', async () => {
        mockRequest.query = {
          page: '1',
          pageSize: 'abc',
        } as unknown as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: 'Invalid pagination parameters',
          }),
        );
      });

      it('should handle invalid pagination values', async () => {
        mockRequest.query = {
          page: '0',
          pageSize: '-1',
        } as unknown as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: 'Invalid pagination parameters',
          }),
        );
      });

      it('should handle missing pagination parameters gracefully', async () => {
        mockRequest.query = {} as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(1, 20);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should handle negative pagination values', async () => {
        mockRequest.query = {
          page: '-1',
          pageSize: '-20',
        } as unknown as ParsedQs;

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 400,
            message: 'Invalid pagination parameters',
          }),
        );
      });

      it('should handle null service response', async () => {
        mockMetricsService.getAllMetrics.mockResolvedValue(null as any);

        await metricsController.getAllMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 500,
            message: 'Metrics service returned null result',
          }),
        );
      });
    });
  });

  describe('Metrics Sync', () => {
    describe('syncMetrics', () => {
      it('should successfully sync metrics and return success message', async () => {
        mockApiResponse.createSuccessResponse.mockReturnValue({
          success: true,
          data: { message: 'Metrics synced successfully' },
        });

        await metricsController.syncMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockMetricsService.syncAllData).toHaveBeenCalled();
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: { message: 'Metrics synced successfully' },
        });
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Metrics sync completed successfully',
        );
      });

      it('should properly handle sync failures', async () => {
        const error = new Error('Sync failed');
        mockMetricsService.syncAllData.mockRejectedValue(error);

        await metricsController.syncMetrics(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error syncing metrics:',
          error,
        );
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 500,
            message: 'Failed to sync metrics',
          }),
        );
      });
    });
  });

  describe('Database Management', () => {
    describe('resetDatabase', () => {
      it('should successfully reset database and return success message', async () => {
        mockApiResponse.createSuccessResponse.mockReturnValue({
          success: true,
          data: { message: 'Database reset successfully' },
        });

        await metricsController.resetDatabase(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockMetricsService.resetAllData).toHaveBeenCalled();
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: { message: 'Database reset successfully' },
        });
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Database reset completed successfully',
        );
      });

      it('should properly handle reset failures', async () => {
        const error = new Error('Reset failed');
        mockMetricsService.resetAllData.mockRejectedValue(error);

        await metricsController.resetDatabase(
          mockRequest,
          mockResponse,
          mockNext,
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error resetting database:',
          error,
        );
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 500,
            message: 'Failed to reset database',
          }),
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should preserve AppError properties when handling errors', async () => {
      const customError = new AppError(418, 'Custom error message');
      mockMetricsService.getAllMetrics.mockRejectedValue(customError);

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 418,
          message: 'Custom error message',
        }),
      );
    });

    it('should transform unknown errors to AppError', async () => {
      mockMetricsService.getAllMetrics.mockRejectedValue(
        'Unexpected error type',
      );

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Failed to fetch metrics',
        }),
      );
    });

    it('should properly log error details', async () => {
      const error = new Error('Detailed error message');
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
    });
  });
});
