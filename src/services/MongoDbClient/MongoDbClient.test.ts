// src/__tests__/services/database/MongoDbClient.test.ts

import { Container } from 'inversify';
import mongoose from 'mongoose';

import { MongoDbClient } from './MongoDbClient.js';
import { createMockLogger } from '../../__mocks__/index.js';
import { Config } from '../../cross-cutting/Config/config.js';
import { TYPES } from '../../utils/types.js';

jest.mock('mongoose');

describe('MongoDbClient', () => {
  let container: Container;
  let mongoDbClient: MongoDbClient;
  let config: Config;
  let mockLogger: ReturnType<typeof createMockLogger>;

  const customEnvLoader = (): NodeJS.ProcessEnv => ({
    DATABASE_URL: 'mongodb://testurl',
    DATABASE_RETRY_DELAY: '100',
    MONGO_CONNECT_TIMEOUT_MS: '1000',
    MONGO_SERVER_SELECTION_TIMEOUT_MS: '1000',
    PORT: '3000',
    BCRYPT_ROUNDS: '10',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test@example.com',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test-private-key',
    GOOGLE_SHEETS_ID: 'test-sheet-id',
    REPO_TOKEN: 'test-repo-token',
    REPO_OWNER: 'test-owner',
    REPO_REPO: 'test-repo',
    JWT_SECRET: 'test-jwt-secret',
    REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    LOG_FILE_PATH: './logs',
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    container = new Container();
    config = Config.getInstance({}, customEnvLoader);
    mockLogger = createMockLogger();

    container.bind(TYPES.Config).toConstantValue(config);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(MongoDbClient).toSelf();

    mongoDbClient = container.get(MongoDbClient);
  });

  afterEach(() => {
    Config.resetInstance();
  });

  describe('connect', () => {
    it('should connect to the database successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection as any) = {
        on: jest.fn(),
      };

      await mongoDbClient.connect();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://testurl', {
        connectTimeoutMS: 1000,
        serverSelectionTimeoutMS: 1000,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully connected to the database',
      );
    });

    it('should throw an error if DATABASE_URL is not defined', async () => {
      const badEnvLoader = (): NodeJS.ProcessEnv => {
        const env = customEnvLoader();
        delete env.DATABASE_URL;
        return env;
      };
      const badConfig = Config.getInstance({}, badEnvLoader);

      // Override the DATABASE_URL getter to return undefined
      Object.defineProperty(badConfig, 'DATABASE_URL', {
        get: () => undefined,
      });

      container.rebind(TYPES.Config).toConstantValue(badConfig);
      mongoDbClient = container.get(MongoDbClient);

      await expect(mongoDbClient.connect()).rejects.toThrow(
        'DATABASE_URL is not defined in the configuration',
      );
    });

    it('should retry connection on failure', async () => {
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);
      (mongoose.connection as any) = {
        on: jest.fn(),
      };

      await mongoDbClient.connect();

      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to connect to the database (attempt 1/5)',
        ),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully connected to the database',
      );
    });

    it('should throw an error after max retries', async () => {
      (mongoose.connect as jest.Mock).mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(mongoDbClient.connect()).rejects.toThrow(
        'Database connection failed: Connection failed',
      );
      expect(mongoose.connect).toHaveBeenCalledTimes(5);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Max retries reached'),
      );
    });
  });

  describe('getDb', () => {
    it('should return the database connection when connected', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection as any) = {
        on: jest.fn(),
      };

      await mongoDbClient.connect();
      const db = mongoDbClient.getDb();

      expect(db).toBe(mongoose.connection);
    });

    it('should throw an error when not connected', () => {
      expect(() => mongoDbClient.getDb()).toThrow(
        'Database not connected. Call connect() first.',
      );
    });
  });

  describe('close', () => {
    it('should close the database connection', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
      (mongoose.connection as any) = {
        on: jest.fn(),
      };
      (mongoose.disconnect as jest.Mock).mockResolvedValueOnce(undefined);

      await mongoDbClient.connect();
      await mongoDbClient.close();

      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database connection closed',
      );
    });

    it('should not attempt to close if not connected', async () => {
      await mongoDbClient.close();

      expect(mongoose.disconnect).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Database connection closed',
      );
    });
  });
});
