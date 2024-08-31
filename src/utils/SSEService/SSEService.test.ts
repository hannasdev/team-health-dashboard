// src/__tests__/unit/services/SSEService.test.ts
import { Response } from 'express';
import { Container } from 'inversify';

import { SSEService } from './SSEService.js';
import {
  createMockLogger,
  createMockConfig,
  createMockProgressTracker,
} from '../../__mocks__/index.js';
import { createErrorResponse } from '../../utils/ApiResponse/ApiResponse.js';
import { AppError } from '../errors.js';
import { TYPES } from '../types.js';

import type {
  ILogger,
  IProgressTracker,
  IConfig,
} from '../../interfaces/index.js';

// Mock dependencies
jest.mock('../../utils/ApiResponse/ApiResponse.js');

describe('SSEService', () => {
  let sseService: SSEService;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockProgressTracker: ReturnType<typeof createMockProgressTracker>;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let mockResponse: jest.Mocked<Response>;
  let container: Container;

  beforeEach(() => {
    // Create mocks
    mockLogger = createMockLogger();
    mockProgressTracker = createMockProgressTracker();
    mockConfig = createMockConfig();
    mockConfig.SSE_TIMEOUT = 5000; // Set a specific timeout for testing

    // Mock setTimeout and clearTimeout
    global.setTimeout = jest.fn() as any;
    global.clearTimeout = jest.fn() as any;

    // Create mock response
    mockResponse = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as any;

    // Set up DI container
    container = new Container();
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IProgressTracker>(TYPES.ProgressTracker)
      .toConstantValue(mockProgressTracker);
    container.bind<SSEService>(TYPES.SSEService).to(SSEService);

    // Get instance of SSEService
    sseService = container.get<SSEService>(TYPES.SSEService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should set up timeout', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      sseService.initialize(mockResponse);

      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        mockConfig.SSE_TIMEOUT,
      );

      // Manually call the timeout function
      const timeoutFn = setTimeoutSpy.mock.calls[0][0] as Function;
      timeoutFn();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in SSEService:',
        expect.any(AppError),
      );
    });
  });

  describe('sendEvent', () => {
    it('should send event correctly', () => {
      sseService.initialize(mockResponse);
      sseService.sendEvent('test', { data: 'test data' });

      expect(mockResponse.write).toHaveBeenCalledWith(
        'event: test\ndata: {"data":"test data"}\n\n',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Sent test event', {
        dataLength: 20,
      });
    });

    it('should handle undefined data', () => {
      sseService.initialize(mockResponse);
      sseService.sendEvent('test', undefined);

      expect(mockResponse.write).toHaveBeenCalledWith(
        'event: test\ndata: \n\n',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('Sent test event', {
        dataLength: 0,
      });
    });

    it('should throw error if not initialized', () => {
      expect(() => sseService.sendEvent('test', { data: 'test data' })).toThrow(
        'SSEService not initialized with a Response object',
      );
    });
  });

  describe('endResponse', () => {
    it('should end response correctly', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      sseService.initialize(mockResponse);

      // Simulate setting a timeout
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      setTimeoutSpy.mockReturnValue(123 as any); // Mock a timeout ID

      sseService['setupTimeout'](); // Call the private method to set up the timeout

      sseService.endResponse();

      expect(mockResponse.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Response ended');
      expect(clearTimeoutSpy).toHaveBeenCalledWith(123); // Check if clearTimeout was called with the correct timeout ID

      clearTimeoutSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('should not end response if already ended', () => {
      sseService.initialize(mockResponse);
      sseService.endResponse();
      mockResponse.end.mockClear();
      sseService.endResponse();

      expect(mockResponse.end).not.toHaveBeenCalled();
    });

    it('should throw error if not initialized', () => {
      expect(() => sseService.endResponse()).toThrow(
        'SSEService not initialized with a Response object',
      );
    });
  });

  describe('handleClientDisconnection', () => {
    it('should handle client disconnection correctly', () => {
      sseService.initialize(mockResponse);
      sseService.handleClientDisconnection();

      expect(mockLogger.info).toHaveBeenCalledWith('Client disconnected');
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('progressCallback', () => {
    it('should send progress event correctly', () => {
      sseService.initialize(mockResponse);
      sseService.progressCallback(50, 100, 'Half way there');

      expect(mockProgressTracker.trackProgress).toHaveBeenCalledWith(
        50,
        100,
        'Half way there',
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"progress":50'),
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Half way there"'),
      );
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError(400, 'Test error');
      (createErrorResponse as jest.Mock).mockReturnValue({
        error: 'Test error',
      });

      sseService.initialize(mockResponse);
      sseService.handleError(appError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in SSEService:',
        appError,
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"error":"Test error"'),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Sent error event to client',
      );
    });

    it('should handle generic Error correctly', () => {
      const genericError = new Error('Generic error');
      (createErrorResponse as jest.Mock).mockReturnValue({
        error: 'An unexpected error occurred',
      });

      sseService.initialize(mockResponse);
      sseService.handleError(genericError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in SSEService:',
        genericError,
      );
      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"error":"An unexpected error occurred"'),
      );
    });
  });

  describe('sendResultEvent', () => {
    it('should send result event correctly', () => {
      const mockResult = {
        metrics: [{ id: '1', value: 10 }],
        errors: [],
        githubStats: { totalPRs: 5, fetchedPRs: 5 },
      };

      sseService.initialize(mockResponse);
      sseService.sendResultEvent(mockResult);

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('"success":true'),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Metrics fetched and sent successfully',
        { metricsCount: 1, errorsCount: 0 },
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });
});
