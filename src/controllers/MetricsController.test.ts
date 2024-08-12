// src/controllers/MetricsController.test.ts
import 'reflect-metadata';
import {
  createMockLogger,
  createMockMetricsService,
} from '../__mocks__/mockFactories.js';
import { MetricsController } from './MetricsController.js';
import { IMetricsService, ILogger } from '../interfaces/index.js';
import { ProgressCallback } from '../types/index.js';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockResponse: any;
  let mockRequest: any;
  let mockNext: jest.Mock;
  let mockLogger: ILogger;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLogger = createMockLogger();
    mockMetricsService =
      createMockMetricsService() as jest.Mocked<IMetricsService>;
    metricsController = new MetricsController(mockMetricsService, mockLogger);

    mockRequest = {
      on: jest.fn(),
    };
    mockResponse = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
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
      expect(mockResponse.write).not.toHaveBeenCalled();
    });

    it('should send "error" event with details on failure', async () => {
      const mockErrorMessage = 'Something went wrong!';

      mockMetricsService.getAllMetrics.mockRejectedValue(
        new Error(mockErrorMessage),
      );

      await metricsController.getAllMetrics(
        {} as any,
        mockResponse,
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
    });

    it('should handle client disconnection', async () => {
      let onCloseHandler: (() => void) | undefined;
      mockRequest.on.mockImplementation(
        (event: string, handler: () => void) => {
          if (event === 'close') {
            onCloseHandler = handler;
          }
        },
      );

      const getAllMetricsPromise = metricsController.getAllMetrics(
        mockRequest,
        mockResponse,
        mockNext,
        90,
      );

      // Simulate client disconnection
      if (onCloseHandler) {
        onCloseHandler();
      }

      await getAllMetricsPromise;

      expect(mockLogger.info).toHaveBeenCalledWith('Client disconnected');
      expect(mockResponse.write).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });
  });
});
