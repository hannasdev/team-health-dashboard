// src/__tests__/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { MetricsController } from '../../controllers/MetricsController';
import type { IMetricsService } from '../../interfaces/IMetricsService';
import type { IMetric } from '../../interfaces/IMetricModel';
import type { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { createMockLogger, MockLogger } from '../../__mocks__/logger';
import type { Logger } from '../../utils/logger';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockLogger: MockLogger;

  beforeAll(() => {
    mockMetricsService = {
      getAllMetrics: jest.fn(),
    };
    mockLogger = createMockLogger();
    metricsController = new MetricsController(
      mockMetricsService,
      mockLogger as Logger,
    );

    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as Partial<Response>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMetrics', () => {
    it('should return all metrics when both services succeed', async () => {
      const mockMetrics: IMetric[] = [
        {
          id: '1',
          name: 'Cycle Time',
          value: 5,
          timestamp: new Date(),
          source: 'Google Sheets',
        },
        {
          id: '2',
          name: 'PR Size',
          value: 100,
          timestamp: new Date(),
          source: 'GitHub',
        },
      ];

      mockMetricsService.getAllMetrics.mockResolvedValue({
        metrics: mockMetrics,
        errors: [],
      });

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors and return a 500 status', async () => {
      const errorMessage = 'Failed to fetch metrics';
      const error = new Error(errorMessage);

      mockMetricsService.getAllMetrics.mockRejectedValue(error);

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        errors: [
          {
            source: 'MetricsController',
            message: errorMessage,
          },
        ],
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in MetricsController:',
        error,
      );
    });

    it('should handle partial failures and return available metrics', async () => {
      const mockMetrics: IMetric[] = [
        {
          id: '1',
          name: 'Cycle Time',
          value: 5,
          timestamp: new Date(),
          source: 'Google Sheets',
        },
      ];
      const mockErrors = [
        { source: 'GitHub', message: 'Failed to fetch GitHub data' },
      ];

      mockMetricsService.getAllMetrics.mockResolvedValue({
        metrics: mockMetrics,
        errors: mockErrors,
      });

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(207);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics,
        errors: mockErrors,
      });
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
