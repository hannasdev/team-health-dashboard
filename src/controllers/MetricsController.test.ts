// src/__tests__/controllers/MetricsController.test.ts
import 'reflect-metadata';
import { MetricsController } from '@/controllers/MetricsController';
import type { IMetricsService, IMetric, ILogger } from '@/interfaces';
import type { Request, Response } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Logger } from '@/utils/logger';
import { createMockLogger } from '@/__mocks__/mockFactories';

describe('MetricsController', () => {
  let metricsController: MetricsController;
  let mockMetricsService: jest.Mocked<IMetricsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockLogger: ILogger;

  beforeEach(() => {
    jest.resetAllMocks();
    mockLogger = createMockLogger();
    mockMetricsService = {
      getAllMetrics: jest.fn(),
    };
    metricsController = new MetricsController(
      mockMetricsService,
      mockLogger as Logger,
    );
    mockRequest = {
      query: {},
    };
    mockResponse = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as Partial<Response>;
  });

  describe('getAllMetrics', () => {
    it('should send progress events and a final result event', async () => {
      const mockMetrics: IMetric[] = [
        {
          id: '1',
          metric_category: 'Efficiency',
          metric_name: 'Metric1',
          value: 10,
          timestamp: new Date(),
          unit: 'points',
          additional_info: '',
          source: 'Source1',
        },
      ];

      mockMetricsService.getAllMetrics.mockImplementation(
        async (progressCallback, timePeriod) => {
          progressCallback?.(0, 100, 'Starting');
          progressCallback?.(50, 100, 'Halfway');
          progressCallback?.(100, 100, 'Completed');
          return {
            metrics: mockMetrics,
            errors: [],
            githubStats: { totalPRs: 10, fetchedPRs: 10, timePeriod: 90 },
          };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":0,"message":"Starting"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":50,"message":"Halfway"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":100,"message":"Completed"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: result\ndata: {"success":true,"data":'),
      );
    });

    it('should handle errors and send an error event', async () => {
      const mockError = new Error('Test error');
      mockMetricsService.getAllMetrics.mockRejectedValue(mockError);

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: error\ndata: {"success":false,"errors":[{"source":"MetricsController","message":"Test error"}],"status":500}',
        ),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in MetricsController:',
        mockError,
      );
    });

    it('should call progress callback correctly', async () => {
      const mockProgressCallback = jest.fn();

      mockMetricsService.getAllMetrics.mockImplementation(
        async (callback, timePeriod) => {
          callback?.(0, 100, 'Starting');
          callback?.(50, 100, 'Halfway');
          callback?.(100, 100, 'Completed');
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
        90,
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":0,"message":"Starting"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":50,"message":"Halfway"}',
        ),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'event: progress\ndata: {"progress":100,"message":"Completed"}',
        ),
      );
    });
  });
});
