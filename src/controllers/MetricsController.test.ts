// src/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import {
  createMockLogger,
  createMockMetricsService,
  createMockMetricsRequest,
  createMockResponse,
} from '../__mocks__/mockFactories.js';
import { MetricsController } from './MetricsController.js';
import { IMetricsService, ILogger } from '../interfaces/index.js';
import { ProgressCallback } from '../types/index.js';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockResponse: Response;
  let mockRequest: Request;
  let mockNext: jest.Mock<NextFunction>;
  let mockLogger: ILogger;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLogger = createMockLogger();
    mockMetricsService =
      createMockMetricsService() as jest.Mocked<IMetricsService>;
    metricsController = new MetricsController(mockMetricsService, mockLogger);

    mockRequest = createMockMetricsRequest({ on: jest.fn() });
    mockResponse = createMockResponse() as Response;
    mockNext = jest.fn();
  });

  describe('getAllMetrics', () => {
    it('should call MetricsService.getAllMetrics with correct parameters', async () => {
      const timePeriod = 90;
      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        timePeriod,
      );

      expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(
        expect.any(Function),
        timePeriod,
      );
    });

    it('should send "result" event with data on success', async () => {
      const mockMetricsData = {
        metrics: [
          {
            id: '1',
            source: 'test',
            value: 100,
            metric_category: 'test_category',
            metric_name: 'test_name',
            timestamp: new Date(),
            unit: 'unit',
            additional_info: 'info',
          },
        ],
        errors: [],
        githubStats: { totalPRs: 10, fetchedPRs: 10, timePeriod: 90 },
      };

      mockMetricsService.getAllMetrics.mockResolvedValue(mockMetricsData);

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        90,
      );

      expect(mockResponse.writeHead).toHaveBeenCalledWith(
        200,
        expect.any(Object),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: result'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          JSON.stringify({
            success: true,
            data: mockMetricsData.metrics,
            errors: mockMetricsData.errors,
            githubStats: mockMetricsData.githubStats,
            status: 200,
          }),
        ),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error on failure', async () => {
      const mockErrorMessage = 'Something went wrong!';
      const mockError = new Error(mockErrorMessage);

      mockMetricsService.getAllMetrics.mockRejectedValue(mockError);

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        90,
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: error'),
      );
    });

    it('should send "error" event with details on failure', async () => {
      const mockErrorMessage = 'Something went wrong!';

      mockMetricsService.getAllMetrics.mockRejectedValue(
        new Error(mockErrorMessage),
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: error'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          JSON.stringify({
            success: false,
            errors: [
              {
                source: 'MetricsController',
                message: mockErrorMessage,
              },
            ],
            status: 500,
          }),
        ),
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should always call res.end() on success', async () => {
      mockMetricsService.getAllMetrics.mockResolvedValue({
        metrics: [],
        errors: [],
        githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
      });

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        90,
      );

      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should not call res.end() on failure', async () => {
      mockMetricsService.getAllMetrics.mockRejectedValue(
        new Error('Test error'),
      );

      await metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        90,
      );

      expect(mockResponse.end).not.toHaveBeenCalled();
      // ADDED: Check that next was called with an error
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle client disconnection', async () => {
      let onCloseHandler: (() => void) | undefined;
      mockRequest.on = jest
        .fn()
        .mockImplementation((event: string, handler: () => void) => {
          if (event === 'close') {
            onCloseHandler = handler;
          }
        });

      // CHANGED: Use a custom mock implementation for getAllMetrics
      mockMetricsService.getAllMetrics.mockImplementation(
        async (progressCallback?: ProgressCallback) => {
          progressCallback?.(25, 100, 'Starting...');
          // Simulate client disconnection after first progress update
          if (onCloseHandler) {
            onCloseHandler();
          }
          // These calls should not result in writes after disconnection
          progressCallback?.(50, 100, 'Halfway there...');
          progressCallback?.(100, 100, 'Completed!');
          return {
            metrics: [],
            errors: [],
            githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Client disconnected');
      // CHANGED: Allow for the initial write calls before disconnection
      expect(mockResponse.write).toHaveBeenCalledTimes(2); // Headers and first progress event
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: progress'),
      );
      expect(mockResponse.end).toHaveBeenCalled();
      // Ensure that the result event is not sent after disconnection
      expect(mockResponse.write).not.toHaveBeenCalledWith(
        expect.stringContaining('event: result'),
      );
    });

    it('should send progress events', async () => {
      mockMetricsService.getAllMetrics.mockImplementation(
        async (progressCallback?: ProgressCallback) => {
          progressCallback?.(25, 100, 'Starting...');
          progressCallback?.(50, 100, 'Halfway there...');
          progressCallback?.(75, 100, 'Almost done...');
          progressCallback?.(100, 100, 'Completed!');
          return {
            metrics: [],
            errors: [],
            githubStats: { totalPRs: 0, fetchedPRs: 0, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledTimes(6); // 1 initial message + 4 progress events + 1 result event
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: progress'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"progress":25'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"progress":50'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"progress":75'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"progress":100'),
      );
    });
  });
});
