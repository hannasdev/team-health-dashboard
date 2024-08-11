// src/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

import {
  createMockLogger,
  createMockMetricsService,
} from '../__mocks__/mockFactories';
import { MetricsController } from '@/controllers/MetricsController';
import { IMetricsService, ILogger } from '@/interfaces';
import { ProgressCallback } from '@/types';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: IMetricsService;
  let mockResponse: any; // We'll mock the Response object directly
  let mockLogger: ILogger;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLogger = createMockLogger();
    mockMetricsService = createMockMetricsService();
    metricsController = new MetricsController(mockMetricsService, mockLogger);

    // Mock the Response object's methods
    mockResponse = {
      write: jest.fn(),
      end: jest.fn(),
    };
  });

  describe('getAllMetrics', () => {
    it('should call MetricsService.getAllMetrics with correct parameters', async () => {
      const timePeriod = 90;
      await metricsController.getAllMetrics(
        {} as any,
        mockResponse,
        timePeriod,
      );

      expect(mockMetricsService.getAllMetrics).toHaveBeenCalledWith(
        expect.any(Function), // Check for progress callback
        timePeriod,
      );
    });

    it('should send "result" event with data on success', async () => {
      const mockMetricsData = {
        metrics: [
          {
            id: '1', // Now a string
            source: 'test',
            value: 100,
            metric_category: 'test_category',
            metric_name: 'test_name',
            timestamp: new Date(),
            unit: 'unit', // Added unit
            additional_info: 'info', // Added additional_info
          },
        ],
        errors: [],
        githubStats: { totalPRs: 10, fetchedPRs: 10, timePeriod: 90 },
      };

      // Mock the implementation directly:
      mockMetricsService.getAllMetrics = jest.fn(
        (progressCallback?: ProgressCallback, timePeriod?: number) =>
          Promise.resolve(mockMetricsData),
      );

      await metricsController.getAllMetrics({} as any, mockResponse, 90);

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: result'),
      );

      // Correct the assertion:
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          JSON.stringify({
            success: true,
            data: mockMetricsData.metrics,
            errors: mockMetricsData.errors,
            githubStats: mockMetricsData.githubStats,
            status: 200, // Expect status 200 for success
          }),
        ),
      );
    });

    it('should send "error" event with details on failure', async () => {
      const mockErrorMessage = 'Something went wrong!';

      // Mock the implementation directly:
      mockMetricsService.getAllMetrics = jest.fn(
        (progressCallback?: ProgressCallback, timePeriod?: number) =>
          Promise.reject(new Error(mockErrorMessage)),
      );

      await metricsController.getAllMetrics({} as any, mockResponse, 90);

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
        ), // Check for the structured error response
      );
    });

    it('should always call res.end()', async () => {
      // Test success case:
      await metricsController.getAllMetrics({} as any, mockResponse, 90);
      expect(mockResponse.end).toHaveBeenCalledTimes(1);

      // Mock for failure - directly implement:
      mockMetricsService.getAllMetrics = jest.fn(
        (progressCallback?: ProgressCallback, timePeriod?: number) =>
          Promise.reject(new Error('Simulated error')),
      );

      await metricsController.getAllMetrics({} as any, mockResponse, 90);
      expect(mockResponse.end).toHaveBeenCalledTimes(2);
    });
  });
});
