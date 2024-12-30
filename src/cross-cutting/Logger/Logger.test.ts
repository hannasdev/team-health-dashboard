import fs from 'fs';
import path from 'path';

import { Container } from 'inversify';
import winston from 'winston';

import { Logger } from './Logger';
import { AppError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

import type { IConfig } from '../../interfaces/IConfig';

// Mock winston
jest.mock('winston', () => {
  const createMockWinstonLogger = () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  });

  const mockFormat = {
    timestamp: jest.fn().mockReturnThis(),
    errors: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis(),
    combine: jest.fn().mockImplementation((...args) => args[args.length - 1]),
  };

  const mockLogger = createMockWinstonLogger();

  return {
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
    format: mockFormat,
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('Logger', () => {
  let container: Container;
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let mockConfig: IConfig;

  const setupContainer = (env: string, format: string = 'json') => {
    process.env.NODE_ENV = env;
    container = new Container();
    container.bind<string>(TYPES.LogLevel).toConstantValue('debug');
    container.bind<string>(TYPES.LogFormat).toConstantValue(format);
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<Logger>(TYPES.Logger).to(Logger);
    return container.get<Logger>(TYPES.Logger);
  };

  beforeEach(() => {
    mockConfig = {
      LOG_FILE_PATH: './logs',
      LOG_LEVEL: 'debug',
      LOG_FORMAT: 'json',
    } as IConfig;

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Logger Initialization', () => {
    it('should create log directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      logger = setupContainer('development');
      expect(fs.mkdirSync).toHaveBeenCalledWith('./logs', { recursive: true });
    });

    it('should not create log directory if it already exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      logger = setupContainer('development');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should use winston logger in development environment', () => {
      logger = setupContainer('development');
      expect(winston.createLogger).toHaveBeenCalled();
    });

    it('should use console logger in test environment', () => {
      logger = setupContainer('test');
      expect(winston.createLogger).not.toHaveBeenCalled();
    });

    it('should configure winston with correct format options', () => {
      logger = setupContainer('development');
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger = setupContainer('test');
    });

    it('should handle undefined meta in info logs', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'info',
          message: 'Test message',
        }),
      );
    });

    it('should handle complex meta objects in error logs', () => {
      const complexMeta = {
        nested: { key: 'value' },
        array: [1, 2, 3],
        date: new Date('2023-01-01'),
      };
      logger.error('Error message', new Error('Test error'), complexMeta);

      const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedMessage.level).toBe('error');
      expect(loggedMessage.nested.key).toBe('value');
      expect(loggedMessage.array).toEqual([1, 2, 3]);
      expect(loggedMessage.error.message).toBe('Test error');
    });

    it('should handle AppError instances correctly', () => {
      const appError = new AppError(400, 'Bad Request', 'VALIDATION_ERROR', {
        field: 'email',
      });
      logger.error('Validation failed', appError);

      const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedMessage.error.statusCode).toBe(400);
      expect(loggedMessage.error.errorCode).toBe('VALIDATION_ERROR');
      expect(loggedMessage.error.details).toEqual({ field: 'email' });
    });

    it('should handle circular references in meta objects', () => {
      const circularObj: any = { key: 'value' };
      circularObj.self = circularObj;
      logger.info('Test message', circularObj);

      const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedMessage.level).toBe('info');
      expect(loggedMessage.message).toBe('Test message');
      expect(loggedMessage.key).toBe('value');
      expect(loggedMessage.self).toEqual({
        key: 'value',
        self: '[Circular Reference]',
      });
    });
  });

  describe('Format Handling', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      // Reset winston format methods before each test
      (winston.format.json as jest.Mock).mockClear();
      (winston.format.simple as jest.Mock).mockClear();
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should use json format when specified', () => {
      logger = setupContainer('development', 'json');
      expect(winston.format.json).toHaveBeenCalled();
    });

    it('should use simple format when specified', () => {
      logger = setupContainer('development', 'simple');
      expect(winston.format.simple).toHaveBeenCalled();
    });

    it('should handle invalid format gracefully', () => {
      // Create logger with invalid format
      logger = setupContainer('development', 'invalid');

      // Verify that createLogger was called with the correct format
      expect(winston.createLogger).toHaveBeenCalled();
      const createLoggerCall = (winston.createLogger as jest.Mock).mock
        .calls[0][0];

      // Verify that the format is json (default) when invalid format is provided
      expect(winston.format.json).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      logger = setupContainer('test');
    });

    it('should handle logging errors gracefully', () => {
      consoleLogSpy.mockImplementationOnce(() => {
        throw new Error('Console error');
      });

      expect(() => {
        logger.error('Test error');
      }).not.toThrow();
    });

    it('should handle non-error objects in error method', () => {
      logger.error('Test message', 'not an error object' as any);
      const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedMessage.level).toBe('error');
      expect(loggedMessage.message).toBe('Test message');
    });
  });

  describe('Log Level Handling', () => {
    it('should respect log level configuration', () => {
      logger = setupContainer('development');
      const mockWinstonLogger = winston.createLogger();

      // Debug level
      logger.debug('Debug message');
      expect(mockWinstonLogger.debug).toHaveBeenCalled();

      // Info level
      logger.info('Info message');
      expect(mockWinstonLogger.info).toHaveBeenCalled();

      // Warning level
      logger.warn('Warning message');
      expect(mockWinstonLogger.warn).toHaveBeenCalled();

      // Error level
      logger.error('Error message');
      expect(mockWinstonLogger.error).toHaveBeenCalled();
    });
  });
});
