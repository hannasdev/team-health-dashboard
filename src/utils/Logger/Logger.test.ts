// src/utils/Logger/Logger.test.ts

import fs from 'fs';

import winston from 'winston';

import { Logger } from './Logger';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe('Logger', () => {
  let logger: Logger;
  const mockLogLevel = 'info';
  const mockLogFormat = 'json';

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    logger = new Logger(mockLogLevel, mockLogFormat);
  });

  it("should create log directory if it doesn't exist", () => {
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('logs'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), {
      recursive: true,
    });
  });

  it('should use json format when specified', () => {
    expect(winston.format.json).toHaveBeenCalled();
  });

  it('should use simple format when not json', () => {
    new Logger(mockLogLevel, 'simple');
    expect(winston.format.simple).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    const message = 'Test info message';
    const meta = { key: 'value' };
    logger.info(message, meta);
    expect((logger as any).logger.info).toHaveBeenCalledWith(message, meta);
  });

  it('should log error messages', () => {
    const message = 'Test error message';
    const error = new Error('Test error');
    const meta = { key: 'value' };
    logger.error(message, error, meta);
    expect((logger as any).logger.error).toHaveBeenCalledWith(message, {
      error,
      ...meta,
    });
  });

  it('should log warn messages', () => {
    const message = 'Test warn message';
    const meta = { key: 'value' };
    logger.warn(message, meta);
    expect((logger as any).logger.warn).toHaveBeenCalledWith(message, meta);
  });

  it('should log debug messages', () => {
    const message = 'Test debug message';
    const meta = { key: 'value' };
    logger.debug(message, meta);
    expect((logger as any).logger.debug).toHaveBeenCalledWith(message, meta);
  });
});
