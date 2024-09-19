import type { ILogger } from '../../interfaces/index.js';

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
