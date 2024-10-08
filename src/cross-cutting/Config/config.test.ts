import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

import { Config } from './config.js';
import { AppError } from '../../utils/errors.js';

jest.mock('fs');
jest.mock('dotenv');
jest.mock('path');

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    Config.resetInstance();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (dotenv.config as jest.Mock).mockReturnValue({ parsed: null });
    (path.resolve as jest.Mock).mockReturnValue('/fake/path/.env');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    Config.resetInstance();
  });

  const setRequiredEnvVars = () => {
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@example.com';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY = 'test-private-key';
    process.env.GOOGLE_SHEETS_ID = 'test-sheet-id';
    process.env.REPO_TOKEN = 'test-repo-token';
    process.env.REPO_OWNER = 'test-owner';
    process.env.REPO_REPO = 'test-repo';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
    process.env.DATABASE_URL = 'mongodb://localhost:27017/testdb';
    process.env.PORT = '3000';
    process.env.CORS_ORIGIN = '*';
    process.env.ACCESS_TOKEN_EXPIRY = '15m';
    process.env.REFRESH_TOKEN_EXPIRY = '7d';
    process.env.BCRYPT_ROUNDS = '10';
    process.env.LOG_LEVEL = 'info';
    process.env.LOG_FORMAT = 'json';
    process.env.LOG_FILE_PATH = './logs';
    process.env.MONGO_CONNECT_TIMEOUT_MS = '30000';
    process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = '30000';
  };

  test('getInstance returns a singleton instance', () => {
    setRequiredEnvVars();
    const instance1 = Config.getInstance();
    const instance2 = Config.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('loads default values when environment variables are not set', () => {
    const config = Config.getInstance();
    expect(config.PORT).toBe(3000);
    expect(config.CORS_ORIGIN).toBe('*');
    expect(config.JWT_SECRET).toBe('insert-jwt-secret-here');
    expect(config.GOOGLE_SHEETS_ID).toBe('insert-google-sheets-id-here');
    expect(config.REPO_OWNER).toBe('insert-repo-owner-here');
  });

  test('overrides default values with environment variables', () => {
    setRequiredEnvVars();
    const config = Config.getInstance();
    expect(config.PORT).toBe(3000);
    expect(config.CORS_ORIGIN).toBe('*');
    expect(config.JWT_SECRET).toBe('test-jwt-secret');
    expect(config.GOOGLE_SHEETS_ID).toBe('test-sheet-id');
    expect(config.REPO_OWNER).toBe('test-owner');
  });

  test('uses customEnvLoader when provided', () => {
    const customEnvLoader = () => ({
      PORT: '5000',
      CORS_ORIGIN: 'https://custom-domain.com',
      JWT_SECRET: 'custom-secret',
      REFRESH_TOKEN_SECRET: 'custom-refresh-secret',
      DATABASE_URL: 'mongodb://custom-db/test',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'custom@example.com',
      GOOGLE_SHEETS_PRIVATE_KEY: 'custom-private-key',
      GOOGLE_SHEETS_ID: 'custom-sheet-id',
      REPO_TOKEN: 'custom-repo-token',
      REPO_OWNER: 'custom-owner',
      REPO_REPO: 'custom-repo',
    });

    const config = Config.getInstance(undefined, customEnvLoader);
    expect(config.PORT).toBe(5000);
    expect(config.CORS_ORIGIN).toBe('https://custom-domain.com');
    expect(config.JWT_SECRET).toBe('custom-secret');
    expect(config.GOOGLE_SHEETS_ID).toBe('custom-sheet-id');
  });

  test('throws AppError when required environment variables are missing', () => {
    expect(() => Config.getInstance()).not.toThrow(AppError);
  });

  test('loads values from .env file in non-test environment', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (dotenv.config as jest.Mock).mockReturnValue({
      parsed: { SOME_VAR: 'some-value' },
    });

    Config.getInstance();

    expect(dotenv.config).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });

  test('does not load from .env file in test environment', () => {
    Config.getInstance();

    expect(dotenv.config).not.toHaveBeenCalled();
    expect(fs.existsSync).not.toHaveBeenCalled();
  });

  test('getAllConfig returns a copy of all configuration', () => {
    setRequiredEnvVars();
    const config = Config.getInstance();
    const allConfig = config.getAllConfig();

    expect(allConfig).toEqual({
      PORT: 3000,
      CORS_ORIGIN: '*',
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
      DATABASE_URL: 'mongodb://localhost:27017/testdb',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'test@example.com',
      GOOGLE_SHEETS_PRIVATE_KEY: 'test-private-key',
      GOOGLE_SHEETS_ID: 'test-sheet-id',
      REPO_TOKEN: 'test-repo-token',
      REPO_OWNER: 'test-owner',
      REPO_REPO: 'test-repo',
      ACCESS_TOKEN_EXPIRY: '15m',
      REFRESH_TOKEN_EXPIRY: '7d',
      BCRYPT_ROUNDS: 10,
      LOG_LEVEL: 'info',
      LOG_FORMAT: 'json',
      LOG_FILE_PATH: './logs',
      MONGO_CONNECT_TIMEOUT_MS: 30000,
      MONGO_SERVER_SELECTION_TIMEOUT_MS: 30000,
      DATABASE_RETRY_DELAY: 5000,
    });

    // Ensure it's a copy, not a reference
    (allConfig as any).PORT = 9999;
    expect(config.PORT).toBe(3000);
  });

  test('generateEnvTemplate creates a template file with default values', () => {
    const mockWriteFileSync = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation();
    const mockGetInstance = jest.spyOn(Config, 'getInstance').mockReturnValue({
      loadDefaults: () => ({
        PORT: 3000,
        CORS_ORIGIN: '*',
        JWT_SECRET: 'default-jwt-secret',
        // ... other default values
      }),
    } as any);

    Config.generateEnvTemplate('test.env.template');

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/fake/path/.env',
      expect.stringContaining('PORT=3000'),
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/fake/path/.env',
      expect.stringContaining('CORS_ORIGIN=*'),
    );

    mockWriteFileSync.mockRestore();
    mockGetInstance.mockRestore();
  });

  test('parses numeric environment variables correctly', () => {
    process.env.PORT = '4000';
    process.env.BCRYPT_ROUNDS = '12';
    process.env.MONGO_CONNECT_TIMEOUT_MS = '60000';

    const config = Config.getInstance();

    expect(config.PORT).toBe(4000);
    expect(config.BCRYPT_ROUNDS).toBe(12);
    expect(config.MONGO_CONNECT_TIMEOUT_MS).toBe(60000);
  });

  test('uses default values for numeric variables when env vars are not set', () => {
    delete process.env.PORT;
    delete process.env.BCRYPT_ROUNDS;
    delete process.env.MONGO_CONNECT_TIMEOUT_MS;

    const config = Config.getInstance();

    expect(config.PORT).toBe(3000); // default value
    expect(config.BCRYPT_ROUNDS).toBe(10); // default value
    expect(config.MONGO_CONNECT_TIMEOUT_MS).toBe(30000); // default value
  });

  test('handles invalid numeric environment variables', () => {
    process.env.PORT = 'not a number';
    setRequiredEnvVars();

    const config = Config.getInstance();

    // It should fall back to the default value
    expect(config.PORT).toBe(3000);
  });
});
