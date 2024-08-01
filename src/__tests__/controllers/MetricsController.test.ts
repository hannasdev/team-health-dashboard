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

  beforeEach(() => {
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
      write: jest.fn(),
    } as Partial<Response>;
  });

  describe('getAllMetrics', () => {
    it('should send progress events and a final result event', async () => {
      const mockMetrics: IMetric[] = [
        {
          id: '1',
          name: 'Metric1',
          value: 10,
          timestamp: new Date(),
          source: 'Source1',
        },
      ];

      mockMetricsService.getAllMetrics.mockImplementation(
        async progressCallback => {
          progressCallback(0, 'Starting');
          progressCallback(50, 'Halfway');
          progressCallback(100, 'Completed');
          return { metrics: mockMetrics, errors: [] };
        },
      );

      await metricsController.getAllMetrics(
        mockRequest as Request,
        mockResponse as Response,
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
  });
});
