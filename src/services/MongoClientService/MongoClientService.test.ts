// src/__tests__/services/database/MongoDbClient.test.ts

import { Container } from 'inversify';
import mongoose from 'mongoose';

import { MongoClientService } from './MongoClientService.js';
import { createMockLogger } from '../../__mocks__/index.js';
import { Config } from '../../cross-cutting/Config/config.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

jest.mock('mongoose');

describe('MongoDbClient', () => {
  let container: Container;
  let mongoDbClient: MongoClientService;
  let config: Config;
  let mockLogger: ReturnType<typeof createMockLogger>;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  let connectionEventHandlers: { [key: string]: Function };

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

    // Setup event handler tracking
    connectionEventHandlers = {};
    (mongoose.connection as any) = {
      on: jest.fn((event, handler) => {
        connectionEventHandlers[event] = handler;
      }),
    };

    container = new Container();
    config = Config.getInstance({}, customEnvLoader);
    mockLogger = createMockLogger();

    container.bind(TYPES.Config).toConstantValue(config);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(MongoClientService).toSelf();

    mongoDbClient = container.get(MongoClientService);
  });

  afterEach(() => {
    Config.resetInstance();
  });

  describe('connect', () => {
    it('should connect to the database successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

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

      Object.defineProperty(badConfig, 'DATABASE_URL', {
        get: () => undefined,
      });

      container.rebind(TYPES.Config).toConstantValue(badConfig);
      mongoDbClient = container.get(MongoClientService);

      await expect(mongoDbClient.connect()).rejects.toThrow(
        'DATABASE_URL is not defined in the configuration',
      );
    });

    it('should retry connection on failure', async () => {
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

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

    describe('disconnection handling', () => {
      beforeEach(async () => {
        // Setup initial successful connection
        (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);
        await mongoDbClient.connect();

        // Clear mocks for fresh test state
        (mongoose.connect as jest.Mock).mockClear();
        mockLogger.warn.mockClear();
        mockLogger.error.mockClear();
      });

      it('should handle disconnection event and attempt reconnection', async () => {
        // Setup for reconnection attempt
        (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

        // Simulate disconnection
        const disconnectHandler = connectionEventHandlers['disconnected'];
        await disconnectHandler(); // This should trigger a reconnection attempt

        // Verify the reconnection attempt
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'MongoDB disconnected. Attempting to reconnect...',
        );
        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://testurl', {
          connectTimeoutMS: 1000,
          serverSelectionTimeoutMS: 1000,
        });
      });

      it('should handle failed reconnection attempt', async () => {
        // Mock failed reconnection - it will fail 5 times due to retry logic
        const reconnectionError = new Error('Connection failed');
        (mongoose.connect as jest.Mock).mockRejectedValue(reconnectionError);

        // Simulate disconnection
        const disconnectHandler = connectionEventHandlers['disconnected'];
        await disconnectHandler();

        // Verify that we log both the max retries error and the final reconnection error
        expect(mockLogger.error).toHaveBeenNthCalledWith(
          1,
          'Max retries reached. Failed to connect to the database: Connection failed',
        );
        expect(mockLogger.error).toHaveBeenNthCalledWith(
          2,
          'Error reconnecting to the database:',
          expect.any(AppError),
        );
      });

      it('should handle database error events', async () => {
        const dbError = new Error('Database error');

        // Simulate error event
        connectionEventHandlers['error'](dbError);

        expect(mockLogger.error).toHaveBeenCalledWith(
          'MongoDB connection error:',
          dbError,
        );
      });
    });
  });

  describe('getDb', () => {
    it('should return the database connection when connected', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(undefined);

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
