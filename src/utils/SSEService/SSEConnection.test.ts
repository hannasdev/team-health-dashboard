// src/utils/SSEService/SSEConnection.test.ts

import { SSEConnection } from './SSEConnection';
import {
  createMockLogger,
  createMockResponse,
  createMockEventEmitter,
} from '../../__mocks__/index.js';
import { Config } from '../../config/config';

import type { IConfig } from '../../interfaces/index.js';

const testConfig = {
  SSE_TIMEOUT: 5000,
  HEARTBEAT_INTERVAL: 100,
  // Add other necessary config properties here
};

describe('SSEConnection', () => {
  let sseConnection: SSEConnection;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfig: IConfig;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockResponse: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = {
      ...testConfig,
      getInstance: jest.fn().mockReturnValue(testConfig),
    } as unknown as jest.Mocked<Config>;
    mockEventEmitter = createMockEventEmitter();

    mockResponse = createMockResponse();
    mockResponse.write.mockClear(); // Clear the mock before each test
    mockResponse.end.mockClear();

    sseConnection = new SSEConnection(
      'test-connection',
      mockResponse,
      mockLogger,
      mockConfig,
      mockEventEmitter,
    );
  });

  it('should set up SSE connection correctly', () => {
    expect(mockResponse.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      }),
    );
  });

  it('should send an event', () => {
    sseConnection.sendEvent('test-event', { data: 'test' });

    expect(mockResponse.write).toHaveBeenCalledWith(
      expect.stringContaining('event: test-event\ndata: {"data":"test"}\n\n'),
    );
  });

  it('should handle timeouts', () => {
    jest.useFakeTimers();
    const timeoutDuration = mockConfig.SSE_TIMEOUT;

    sseConnection['setupTimeout']();

    jest.advanceTimersByTime(timeoutDuration);

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Error in SSE connection test-connection:`,
      expect.any(Error),
    );
    expect(mockResponse.end).toHaveBeenCalled();
  });

  it('should send heartbeats', () => {
    jest.useFakeTimers();
    const heartbeatInterval = mockConfig.HEARTBEAT_INTERVAL;

    sseConnection['startHeartbeat']();

    jest.advanceTimersByTime(heartbeatInterval);

    expect(mockResponse.write).toHaveBeenCalledWith(
      expect.stringContaining('event: heartbeat\ndata:'),
    );
  });

  it('should handle errors', () => {
    const testError = new Error('Test error');
    sseConnection.handleError(testError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in SSE connection'),
      testError,
    );
    expect(mockResponse.write).toHaveBeenCalledWith(
      expect.stringContaining('event: error\ndata:'),
    );
    expect(mockResponse.end).toHaveBeenCalled();
  });

  it('should end the connection', () => {
    sseConnection.end();

    expect(mockResponse.end).toHaveBeenCalled();
    expect(mockEventEmitter.removeListener).toHaveBeenCalledTimes(3);
  });

  it('should not send events after the connection is ended', () => {
    sseConnection.end();
    mockResponse.write.mockClear(); // Clear the mock after ending the connection
    sseConnection.sendEvent('test-event', { data: 'test' });

    expect(mockResponse.write).not.toHaveBeenCalled();
  });

  it('should clear timeout and interval on end', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    sseConnection.end();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should handle errors even if the connection is already ended', () => {
    sseConnection.end();
    mockResponse.write.mockClear(); // Clear the mock after ending the connection
    sseConnection.handleError(new Error('Test error'));

    expect(mockLogger.error).toHaveBeenCalled();
    // The write and end methods should not be called again
    expect(mockResponse.write).not.toHaveBeenCalled();
    expect(mockResponse.end).toHaveBeenCalledTimes(1);
  });
});
