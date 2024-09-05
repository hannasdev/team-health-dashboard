import { SSEService } from './SSEService';
import {
  createMockLogger,
  createMockResponse,
  createMockEventEmitter,
} from '../../__mocks__';
import { Config } from '../../cross-cutting/Config/config';

import type { IConfig } from '../../interfaces/index.js';

const testConfig = {
  SSE_TIMEOUT: 5000,
  HEARTBEAT_INTERVAL: 100,
  // Add other necessary config properties here
};

describe('SSEService', () => {
  let sseService: SSEService;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfig: IConfig;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = Config.getInstance(testConfig);
    mockEventEmitter = createMockEventEmitter();

    sseService = new SSEService(mockLogger, mockConfig, mockEventEmitter);
  });

  it('should create a new connection', () => {
    const mockResponse = createMockResponse();
    const connectionId = 'test-connection';

    sseService.createConnection(connectionId, mockResponse);

    // Instead of checking the private 'connections' property, test the behavior
    expect(() => sseService.sendEvent(connectionId, 'test', {})).not.toThrow();
  });

  it('should send an event to a specific connection', () => {
    const connectionId = 'test-connection';
    const mockResponse = createMockResponse();
    sseService.createConnection(connectionId, mockResponse);

    sseService.sendEvent(connectionId, 'test-event', { data: 'test' });

    expect(mockResponse.write).toHaveBeenCalledWith(
      expect.stringContaining('event: test-event\ndata: {"data":"test"}\n\n'),
    );
  });

  it('should end a specific connection', () => {
    const connectionId = 'test-connection';
    const mockResponse = createMockResponse();
    sseService.createConnection(connectionId, mockResponse);

    sseService.endConnection(connectionId);

    expect(mockResponse.end).toHaveBeenCalled();
    expect(() => sseService.sendEvent(connectionId, 'test', {})).toThrow();
  });

  it('should handle client disconnection', () => {
    const connectionId = 'test-connection';
    const mockResponse = createMockResponse();
    sseService.createConnection(connectionId, mockResponse);

    sseService.handleClientDisconnection(connectionId);

    expect(mockResponse.end).toHaveBeenCalled();
    expect(() => sseService.sendEvent(connectionId, 'test', {})).toThrow();
  });

  it('should throw an error when creating a connection that already exists', () => {
    const mockResponse = createMockResponse();
    const connectionId = 'test-connection';

    sseService.createConnection(connectionId, mockResponse);

    expect(() => {
      sseService.createConnection(connectionId, mockResponse);
    }).toThrow('Connection already exists');
  });

  it('should throw an error when sending an event to a non-existent connection', () => {
    expect(() => {
      sseService.sendEvent('non-existent', 'test-event', { data: 'test' });
    }).toThrow('Connection not found');
  });

  it('should not throw when ending a non-existent connection', () => {
    expect(() => {
      sseService.endConnection('non-existent');
    }).not.toThrow();
  });
});
