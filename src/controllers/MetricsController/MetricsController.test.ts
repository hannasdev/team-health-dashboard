// src/controllers/MetricsController/MetricsController.test.ts

import { Request, Response, NextFunction } from 'express';

import { MetricsController } from './MetricsController';
import {
  createMockMetricsService,
  createMockLogger,
  createMockSSEService,
  createMockMetricsRequest,
  createMockMetric,
} from '../../__mocks__/';
import { AppError } from '../../utils/errors';

import type { IMetric } from '../../interfaces';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: ReturnType<typeof createMockMetricsService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockSSEService: ReturnType<typeof createMockSSEService>;
  let mockRequest: Request;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockMetricsService = createMockMetricsService();
    mockLogger = createMockLogger();
    mockSSEService = createMockSSEService();

    metricsController = new MetricsController(
      mockMetricsService,
      mockLogger,
      mockSSEService,
    );

    mockRequest = createMockMetricsRequest({
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
      query: {},
      on: jest.fn(),
    });
    mockResponse = {
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getAllMetrics', () => {
    it('should log the request information', async () => {
      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Received getAllMetrics request',
        {
          timePeriod: 90,
          userAgent: 'test-agent',
          ip: '127.0.0.1',
        },
      );
    });

    it('should initialize SSE and set up client disconnection handler', async () => {
      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.initialize).toHaveBeenCalledWith(mockResponse);
      expect(mockRequest.on).toHaveBeenCalledWith(
        'close',
        mockSSEService.handleClientDisconnection,
      );
    });

    it('should call metricsService.getAllMetrics with correct parameters', async () => {
      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(
        mockSSEService.progressCallback,
        90,
      );
    });

    it('should send result event when metrics are fetched successfully', async () => {
      const mockMetrics: IMetric[] = [createMockMetric(), createMockMetric()];
      const mockResult = {
        metrics: mockMetrics,
        errors: [{ source: 'TestSource', message: 'Test error message' }],
        githubStats: { totalPRs: 10, fetchedPRs: 8, timePeriod: 90 },
      };
      mockMetricsService.getAllMetrics.mockResolvedValue(mockResult);

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendResultEvent).toHaveBeenCalledWith(mockResult);
    });

    it('should handle simulated error when query parameter is set', async () => {
      mockRequest.query = { error: 'true' };

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.handleError).toHaveBeenCalledWith(
        expect.any(AppError),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        expect.any(AppError),
      );
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      mockMetricsService.getAllMetrics.mockRejectedValue(unknownError);

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.handleError).toHaveBeenCalledWith(unknownError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        unknownError,
      );
    });
  });
});
