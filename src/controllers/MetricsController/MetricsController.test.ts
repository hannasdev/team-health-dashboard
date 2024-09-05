import { Response, NextFunction } from 'express';

import { MetricsController } from './MetricsController';
import {
  createMockMetricsService,
  createMockLogger,
  createMockSSEService,
  createMockMetricsRequest,
  createMockMetric,
} from '../../__mocks__/';
import { AppError } from '../../utils/errors';

import type { IMetric, IAuthRequest } from '../../interfaces';
import type { ProgressCallback } from '../../types'; // Make sure this import is correct

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: ReturnType<typeof createMockMetricsService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockSSEService: ReturnType<typeof createMockSSEService>;
  let mockRequest: IAuthRequest;
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
      headers: { 'user-agent': 'test-agent', accept: 'text/event-stream' },
      ip: '127.0.0.1',
      query: {},
      on: jest.fn(),
    }) as IAuthRequest;
    mockResponse = {
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('getAllMetrics', () => {
    it('should create SSE connection and set up client disconnection handler', async () => {
      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.createConnection).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        mockResponse,
      );
      expect(mockRequest.on).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
    });

    it('should call metricsService.getAllMetrics with correct parameters', async () => {
      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(
        expect.any(Function),
        90,
      );
    });

    it('should send progress events', async () => {
      mockMetricsService.getAllMetrics.mockImplementation(
        async (progressCallback?: ProgressCallback) => {
          if (progressCallback) {
            progressCallback(50, 100, 'Halfway there');
          }
          return {
            metrics: [],
            errors: [],
            githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        'progress',
        { current: 50, total: 100, message: 'Halfway there' },
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
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        'result',
        mockResult,
      );
    });

    it('should handle simulated error when query parameter is set', async () => {
      mockRequest.query = { error: 'true' };

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        'error',
        { message: 'Simulated server error' },
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
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        'error',
        { message: 'Unknown error' },
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        unknownError,
      );
    });

    it('should end connection after sending result', async () => {
      jest.useFakeTimers();
      mockMetricsService.getAllMetrics.mockResolvedValue({
        metrics: [],
        errors: [],
        githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
      });

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      jest.advanceTimersByTime(5000);

      expect(mockSSEService.endConnection).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
      );

      jest.useRealTimers();
    });

    it('should cancel operation on client disconnection', async () => {
      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      const [[event, closeHandler]] = (mockRequest.on as jest.Mock).mock.calls;
      expect(event).toBe('close');

      closeHandler();

      expect(mockSSEService.handleClientDisconnection).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
      );
      expect(mockMetricsService.cancelOperation).toHaveBeenCalled();
    });
  });
});
