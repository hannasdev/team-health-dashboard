import { Response, NextFunction } from 'express';

import { MetricsController } from './MetricsController';
import {
  createMockMetricsService,
  createMockLogger,
  createMockSSEService,
  createMockMetricsRequest,
  createMockMetric,
} from '../../../__mocks__';
import { AppError } from '../../../utils/errors';

import type { IMetric, IAuthRequest } from '../../../interfaces';
import type { ProgressCallback } from '../../../types';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: ReturnType<typeof createMockMetricsService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockSSEService: ReturnType<typeof createMockSSEService>;
  let mockRequest: IAuthRequest;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

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
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
  });

  describe('getAllMetrics', () => {
    it('should call metricsService.getAllMetrics with correct parameters', async () => {
      (mockRequest as any).sseConnectionId = 'test-connection-id';

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
      (mockRequest as any).sseConnectionId = 'test-connection-id';

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
        'test-connection-id',
        'progress',
        { current: 50, total: 100, message: 'Halfway there' },
      );
    });

    it('should send result event when metrics are fetched successfully', async () => {
      (mockRequest as any).sseConnectionId = 'test-connection-id';

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
        'test-connection-id',
        'result',
        mockResult,
      );
    });

    it('should handle errors during metrics fetching', async () => {
      (mockRequest as any).sseConnectionId = 'test-connection-id';

      const testError = new Error('Test error');
      mockMetricsService.getAllMetrics.mockRejectedValue(testError);

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        'test-connection-id',
        'error',
        { message: 'Test error' }, // Changed this line to match the actual error message
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error fetching metrics:',
        testError,
      );
    });

    it('should call next with an error if sseConnectionId is missing', async () => {
      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockNext).toHaveBeenCalled();

      const calls = mockNext.mock.calls;

      if (calls.length > 0 && calls[0].length > 0) {
        const error = calls[0][0] as unknown;

        if (error instanceof Error) {
          expect(error.message).toBe('SSE connection not set up');
          expect(error).toBeInstanceOf(AppError);
        } else {
          fail('Expected mockNext to be called with an Error');
        }
      } else {
        fail('Expected mockNext to be called with arguments');
      }
    });
  });

  describe('setupSSE', () => {
    it('should create an SSE connection', () => {
      metricsController.setupSSE(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockSSEService.createConnection).toHaveBeenCalledWith(
        expect.stringContaining('metrics-'),
        mockResponse,
      );
    });

    it('should set up a close handler for the request', () => {
      metricsController.setupSSE(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.on).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
    });

    it('should call next after setup', () => {
      metricsController.setupSSE(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set sseConnectionId on the request', () => {
      metricsController.setupSSE(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      expect((mockRequest as any).sseConnectionId).toMatch(/^metrics-/);
    });
  });
});
