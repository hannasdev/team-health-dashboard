// src/__tests__/unit/services/SSEService.test.ts
import { Response } from 'express';
import { Container } from 'inversify';

import {
  createMockLogger,
  createMockProgressTracker,
  createMockApiResponse,
} from '../../__mocks__/index';
import { Config } from '../../config/config';
import { AppError } from '../../utils/errors';
import { SSEService } from '../../utils/SSEService/SSEService';
import { TYPES } from '../../utils/types';

import type {
  IApiResponse,
  ILogger,
  IProgressTracker,
  ISSEService,
  IConfig,
  IEventEmitter,
} from '../../interfaces';

describe('SSEService', () => {
  let container: Container;
  let sseService: ISSEService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockProgressTracker: jest.Mocked<IProgressTracker>;
  let mockConfig: IConfig;
  let mockResponse: jest.Mocked<Response>;
  let mockApiResponse: jest.Mocked<IApiResponse>;
  let mockEventEmitter: jest.Mocked<IEventEmitter>;

  const testConfig = {
    REPO_OWNER: 'github_owner_test',
    REPO_REPO: 'github_repo_test',
    JWT_SECRET: 'test-secret',
    REPO_TOKEN: 'test-github-token',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test-google-sheets-private-key',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test-client-email@example.com',
    GOOGLE_SHEETS_SHEET_ID: 'test-sheet-id',
    REFRESH_TOKEN_SECRET: 'test-token-secret',
    MONGODB_URI: 'mongodb://localhost:27017/test-db',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
    SSE_TIMEOUT: 5000,
    HEARTBEAT_INTERVAL: 100, // Set a shorter interval for testing
  };

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockProgressTracker = createMockProgressTracker();
    mockConfig = Config.getInstance(testConfig);
    mockApiResponse = createMockApiResponse();

    jest.useFakeTimers();
    global.setInterval = jest.fn(() => 1) as any;
    global.clearInterval = jest.fn() as any;
    global.setTimeout = jest.fn(() => 1) as any;
    global.clearTimeout = jest.fn() as any;

    mockResponse = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as any;

    mockEventEmitter = {
      on: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
    };

    container = new Container();
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IProgressTracker>(TYPES.ProgressTracker)
      .toConstantValue(mockProgressTracker);
    container
      .bind<IApiResponse>(TYPES.ApiResponse)
      .toConstantValue(mockApiResponse);
    container
      .bind<IEventEmitter>(TYPES.EventEmitter)
      .toConstantValue(mockEventEmitter);
    container
      .bind<ISSEService>(TYPES.SSEService)
      .to(SSEService)
      .inSingletonScope();

    sseService = container.get<ISSEService>(TYPES.SSEService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('initialize', () => {
    it('should set up SSE, timeout, heartbeat, and event listeners', () => {
      const setupSSESpy = jest.spyOn(sseService as any, 'setupSSE');
      const setupTimeoutSpy = jest.spyOn(sseService as any, 'setupTimeout');
      const startHeartbeatSpy = jest.spyOn(sseService as any, 'startHeartbeat');
      const setupEventListenersSpy = jest.spyOn(
        sseService as any,
        'setupEventListeners',
      );

      sseService.initialize(mockResponse);

      expect(setupSSESpy).toHaveBeenCalled();
      expect(setupTimeoutSpy).toHaveBeenCalled();
      expect(startHeartbeatSpy).toHaveBeenCalled();
      expect(setupEventListenersSpy).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should set up event listeners on initialize', () => {
      sseService.initialize(mockResponse);

      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'sendEvent',
        expect.any(Function),
      );
      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'endResponse',
        expect.any(Function),
      );
      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });

    it('should emit sendEvent when calling sendEvent method', () => {
      sseService.initialize(mockResponse);
      sseService.sendEvent('test', { data: 'test data' });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sendEvent', 'test', {
        data: 'test data',
      });
    });

    it('should write to response when handling sendEvent', () => {
      sseService.initialize(mockResponse);
      (sseService as any).handleSendEvent('test', { data: 'test data' });

      expect(mockResponse.write).toHaveBeenCalledWith(
        expect.stringContaining('event: test\ndata: {"data":"test data"}\n\n'),
      );
    });
  });

  describe('endResponse', () => {
    it('should end response and stop heartbeat correctly', () => {
      sseService.initialize(mockResponse);
      (sseService as any).setupTimeout(); // Ensure timeout is set up
      sseService.endResponse();

      expect(mockResponse.end).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Response ended');
      expect(global.clearTimeout).toHaveBeenCalled();
      expect(global.clearInterval).toHaveBeenCalled();
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
    it('should emit sendEvent with progress data', () => {
      sseService.initialize(mockResponse);
      sseService.progressCallback(50, 100, 'Half way there');

      expect(mockProgressTracker.trackProgress).toHaveBeenCalledWith(
        50,
        100,
        'Half way there',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'progress',
        {
          progress: 50,
          message: 'Half way there',
          current: 50,
          total: 100,
        },
      );
    });

    it('should reach 100% progress', () => {
      sseService.initialize(mockResponse);

      // Simulate progress updates
      sseService.progressCallback(0, 100, 'Starting');
      sseService.progressCallback(50, 100, 'Halfway');
      sseService.progressCallback(100, 100, 'Complete');

      // Check that the last call to emit was with 100% progress
      expect(mockEventEmitter.emit).toHaveBeenLastCalledWith(
        'sendEvent',
        'progress',
        expect.objectContaining({
          progress: 100,
          message: 'Complete',
          current: 100,
          total: 100,
        }),
      );

      // Verify that the progress tracker was called correctly
      expect(mockProgressTracker.trackProgress).toHaveBeenCalledTimes(3);
      expect(mockProgressTracker.trackProgress).toHaveBeenLastCalledWith(
        100,
        100,
        'Complete',
      );
    });

    it('should cap progress at 100% even if current exceeds total', () => {
      sseService.initialize(mockResponse);

      sseService.progressCallback(110, 100, 'Exceeded');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'progress',
        expect.objectContaining({
          progress: 100, // Should be capped at 100
          message: 'Exceeded',
          current: 110,
          total: 100,
        }),
      );
    });
  });

  describe('handleError', () => {
    it('should emit error event and stop heartbeat', () => {
      const appError = new AppError(400, 'Test error');
      mockApiResponse.createErrorResponse.mockReturnValue({
        success: false,
        error: 'Test error',
        statusCode: 400,
      });

      sseService.initialize(mockResponse);
      sseService.handleError(appError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in SSEService:',
        appError,
      );
      expect(mockApiResponse.createErrorResponse).toHaveBeenCalledWith(
        'Test error',
        400,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'error',
        expect.any(Object),
      );
      expect(clearInterval).toHaveBeenCalled();
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle generic Error correctly', () => {
      const genericError = new Error('Generic error');
      mockApiResponse.createErrorResponse.mockReturnValue({
        success: false,
        error: 'An unexpected error occurred',
        statusCode: 500,
      });

      sseService.initialize(mockResponse);
      sseService.handleError(genericError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in SSEService:',
        genericError,
      );
      expect(mockApiResponse.createErrorResponse).toHaveBeenCalledWith(
        'An unexpected error occurred',
        500,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'error',
        expect.objectContaining({
          error: 'An unexpected error occurred',
          statusCode: 500,
        }),
      );
    });
  });

  describe('sendResultEvent', () => {
    it('should emit sendEvent with result data', () => {
      const mockResult = {
        metrics: [{ id: '1', value: 10 }],
        errors: [],
        githubStats: { totalPRs: 5, fetchedPRs: 5 },
      };

      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: {
          metrics: mockResult.metrics,
          errors: mockResult.errors,
          githubStats: mockResult.githubStats,
          status: 200,
        },
      });

      sseService.initialize(mockResponse);
      sseService.sendResultEvent(mockResult);

      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith({
        metrics: mockResult.metrics,
        errors: mockResult.errors,
        githubStats: mockResult.githubStats,
        status: 200,
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'result',
        expect.any(Object),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Metrics fetched and sent successfully',
        { metricsCount: 1, errorsCount: 0 },
      );
    });
  });

  describe('event listeners', () => {
    it('should set up event listeners on initialize', () => {
      sseService.initialize(mockResponse);

      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'sendEvent',
        expect.any(Function),
      );
      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'endResponse',
        expect.any(Function),
      );
      expect(mockEventEmitter.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });
  });

  describe('heartbeat', () => {
    it('should start heartbeat on initialize', () => {
      sseService.initialize(mockResponse);

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        testConfig.HEARTBEAT_INTERVAL,
      );
    });

    it('should send heartbeat events', () => {
      sseService.initialize(mockResponse);
      (sseService as any).triggerHeartbeat();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sendEvent',
        'heartbeat',
        expect.objectContaining({ timestamp: expect.any(String) }),
      );
    });

    it('should stop heartbeat when calling endResponse', () => {
      sseService.initialize(mockResponse);
      sseService.endResponse();

      expect(clearInterval).toHaveBeenCalled();
    });
  });
});
