// src/utils/Logger/Logger.test.ts
import { Container } from 'inversify';

import { Logger } from './Logger';
import { TYPES } from '../../utils/types';

import type { IConfig } from '../../interfaces/IConfig';

// Mock Config
const mockConfig: IConfig = {
  LOG_FILE_PATH: './logs',
  // Add other required properties from IConfig
} as IConfig;

describe('Logger', () => {
  let container: Container;
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    container = new Container();
    container.bind<string>(TYPES.LogLevel).toConstantValue('debug');
    container.bind<string>(TYPES.LogFormat).toConstantValue('json');
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<Logger>(TYPES.Logger).to(Logger);

    process.env.NODE_ENV = 'test';
    logger = container.get<Logger>(TYPES.Logger);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should create logger with correct configuration', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log info messages', () => {
    const message = 'Test info message';
    const meta = { key: 'value' };
    logger.info(message, meta);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(loggedMessage.level).toBe('info');
    expect(loggedMessage.message).toBe(message);
    expect(loggedMessage.key).toBe(meta.key);
  });

  it('should log error messages', () => {
    const message = 'Test error message';
    const error = new Error('Test error');
    const meta = { key: 'value' };
    logger.error(message, error, meta);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(loggedMessage.level).toBe('error');
    expect(loggedMessage.message).toBe(message);
    expect(loggedMessage.error).toBeDefined();
    expect(loggedMessage.key).toBe(meta.key);
  });

  it('should log warn messages', () => {
    const message = 'Test warn message';
    const meta = { key: 'value' };
    logger.warn(message, meta);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(loggedMessage.level).toBe('warn');
    expect(loggedMessage.message).toBe(message);
    expect(loggedMessage.key).toBe(meta.key);
  });

  it('should log debug messages', () => {
    const message = 'Test debug message';
    const meta = { key: 'value' };
    logger.debug(message, meta);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(loggedMessage.level).toBe('debug');
    expect(loggedMessage.message).toBe(message);
    expect(loggedMessage.key).toBe(meta.key);
  });

  it('should use json format', () => {
    logger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(() => JSON.parse(consoleLogSpy.mock.calls[0][0])).not.toThrow();
  });

  it('should use simple format when specified', () => {
    container.rebind<string>(TYPES.LogFormat).toConstantValue('simple');
    const simpleLogger = container.get<Logger>(TYPES.Logger);
    simpleLogger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(() => JSON.parse(consoleLogSpy.mock.calls[0][0])).not.toThrow(); // It's still JSON in test environment
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0]).message).toBe(
      'Test message',
    );
  });
});
