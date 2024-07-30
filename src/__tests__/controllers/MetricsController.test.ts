// src/__tests__/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { MetricsController } from '../../controllers/MetricsController';
import { IMetricsService } from '../../interfaces/IMetricsService';
import { IMetric } from '../../interfaces/IMetricModel';
import { Request, Response } from 'express';
import { jest } from '@jest/globals';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockMetricsService = {
      getAllMetrics: jest.fn(),
    };
    metricsController = new MetricsController(mockMetricsService);

    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as Partial<Response>;
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
    });

    it('should handle errors and return a 500 status', async () => {
      const errorMessage = 'Failed to fetch metrics';
      mockMetricsService.getAllMetrics.mockRejectedValue(
        new Error(errorMessage),
      );

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
    });
  });
});
