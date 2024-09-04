import type {
  IBcryptService,
  IJwtService,
  ILogger,
  ISSEService,
  IApiResponse,
} from '../interfaces';

export function createMockSSEService(): jest.Mocked<ISSEService> {
  return {
    initialize: jest.fn(),
    sendEvent: jest.fn(),
    endResponse: jest.fn(),
    handleClientDisconnection: jest.fn(),
    progressCallback: jest.fn(),
    handleError: jest.fn(),
    sendResultEvent: jest.fn(),
    triggerHeartbeat: jest.fn(),
  };
}

export function createMockLogger(): jest.Mocked<ILogger> & {
  mockClear: () => void;
  getLoggedMessages: () => {
    level: string;
    message: string;
    meta?: Record<string, unknown>;
  }[];
} {
  const loggedMessages: {
    level: string;
    message: string;
    meta?: Record<string, unknown>;
  }[] = [];

  const logger: jest.Mocked<ILogger> = {
    info: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'info', message, meta });
    }),
    warn: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'warn', message, meta });
    }),
    error: jest.fn(
      (message: string, error?: Error, meta?: Record<string, unknown>) => {
        loggedMessages.push({
          level: 'error',
          message,
          meta: { ...meta, error },
        });
      },
    ),
    debug: jest.fn((message: string, meta?: Record<string, unknown>) => {
      loggedMessages.push({ level: 'debug', message, meta });
    }),
  };

  return {
    ...logger,
    mockClear: () => {
      logger.info.mockClear();
      logger.warn.mockClear();
      logger.error.mockClear();
      logger.debug.mockClear();
      loggedMessages.length = 0;
    },
    getLoggedMessages: () => [...loggedMessages],
  };
}

export const createCacheDecoratorMock = () => {
  const cacheable = jest.fn().mockImplementation(() => jest.fn());

  class MockCacheableClass {
    constructor(public cacheService: any) {}
  }

  return {
    Cacheable: cacheable,
    CacheableClass: MockCacheableClass,
  };
};

export function createMockBcryptService(): jest.Mocked<IBcryptService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  };
}

export function createMockJwtService(): jest.Mocked<IJwtService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };
}

export function createMockApiResponse(): jest.Mocked<IApiResponse> {
  return {
    createSuccessResponse: jest.fn(),
    createErrorResponse: jest.fn(),
  };
}
