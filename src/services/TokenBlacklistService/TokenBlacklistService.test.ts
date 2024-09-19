// src/services/token/TokenBlacklistService.test.ts

import { TokenBlacklistService } from './TokenBlacklistService';
import {
  createMockLogger,
  createMockMongoDbClient,
} from '../../__mocks__/index.js';

import type { ILogger, IMongoDbClient } from '../../interfaces/index';

describe('TokenBlacklistService', () => {
  let tokenBlacklistService: TokenBlacklistService;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMongoClient: jest.Mocked<IMongoDbClient>;
  let mockCollection: jest.Mocked<any>;

  beforeEach(() => {
    jest.useFakeTimers();

    mockLogger = createMockLogger();
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      deleteMany: jest.fn(),
    };
    mockMongoClient = createMockMongoDbClient();
    mockMongoClient.getDb.mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any);

    tokenBlacklistService = new TokenBlacklistService(
      mockLogger,
      mockMongoClient,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('blacklistToken', () => {
    it('should insert a token into the blacklist', async () => {
      const token = 'testToken';
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      await tokenBlacklistService.blacklistToken(token, expiresAt);

      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        token,
        expiresAt,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Token blacklisted'),
      );
    });

    it('should handle errors when inserting a token', async () => {
      const token = 'testToken';
      const expiresAt = Date.now() + 3600000;
      const error = new Error('Database error');
      mockCollection.insertOne.mockRejectedValue(error);

      await expect(
        tokenBlacklistService.blacklistToken(token, expiresAt),
      ).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error blacklisting token:',
        error,
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for a blacklisted token', async () => {
      const token = 'blacklistedToken';
      mockCollection.findOne.mockResolvedValue({ token });

      const result = await tokenBlacklistService.isTokenBlacklisted(token);

      expect(result).toBe(true);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ token });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Result: true'),
      );
    });

    it('should return false for a non-blacklisted token', async () => {
      const token = 'nonBlacklistedToken';
      mockCollection.findOne.mockResolvedValue(null);

      const result = await tokenBlacklistService.isTokenBlacklisted(token);

      expect(result).toBe(false);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ token });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Result: false'),
      );
    });

    it('should handle errors when checking if a token is blacklisted', async () => {
      const token = 'testToken';
      const error = new Error('Database error');
      mockCollection.findOne.mockRejectedValue(error);

      await expect(
        tokenBlacklistService.isTokenBlacklisted(token),
      ).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking if token is blacklisted:',
        error,
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should log a warning (not implemented)', async () => {
      const userId = 'testUserId';

      await tokenBlacklistService.revokeAllUserTokens(userId);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not implemented'),
      );
    });
  });

  describe('cleanup', () => {
    it('should delete expired tokens', async () => {
      const deletedCount = 5;
      mockCollection.deleteMany.mockResolvedValue({ deletedCount });

      const result = await tokenBlacklistService._testOnly_triggerCleanup();

      expect(result).toBe(deletedCount);
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Number) },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Cleaned up ${deletedCount} expired blacklisted tokens`,
      );
    });

    it('should run cleanup task periodically', async () => {
      jest.spyOn(tokenBlacklistService as any, 'cleanup').mockResolvedValue(0);

      // Set up a short interval for testing
      (tokenBlacklistService as any).setupCleanupTask(1000);

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      // The cleanup method should have been called 5 times
      expect((tokenBlacklistService as any).cleanup).toHaveBeenCalledTimes(5);
    });

    it('should handle errors during cleanup', async () => {
      const error = new Error('Cleanup error');
      mockCollection.deleteMany.mockRejectedValue(error);

      const result = await tokenBlacklistService._testOnly_triggerCleanup();

      expect(result).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error during token blacklist cleanup:',
        error,
      );
    });
  });
});
