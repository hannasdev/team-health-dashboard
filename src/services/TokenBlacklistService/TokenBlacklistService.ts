// src/services/token/TokenBlacklistService.ts
import { injectable, inject } from 'inversify';

import { TYPES } from '../../utils/types.js';

import type {
  ITokenBlacklistService,
  ILogger,
  IMongoDbClient,
} from '../../interfaces/index.js';

@injectable()
export class TokenBlacklistService implements ITokenBlacklistService {
  private readonly COLLECTION_NAME = 'blacklisted_tokens';
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.MongoDbClient) private mongoClient: IMongoDbClient,
  ) {
    this.setupCleanupTask();
  }

  private setupCleanupTask(interval: number = 24 * 60 * 60 * 1000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => this.cleanup(), interval);
  }

  async blacklistToken(token: string, expiresAt: number): Promise<void> {
    const collection = this.mongoClient
      .getDb()
      .collection(this.COLLECTION_NAME);
    await collection.insertOne({ token, expiresAt });
    this.logger.info(`Token blacklisted: ${token.substring(0, 10)}...`);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const collection = this.mongoClient
      .getDb()
      .collection(this.COLLECTION_NAME);
    const result = await collection.findOne({ token });
    const isBlacklisted = !!result;
    this.logger.debug(
      `Checking if token is blacklisted: ${token.substring(0, 10)}... Result: ${isBlacklisted}`,
    );
    return isBlacklisted;
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // This method would require storing user ID with tokens, which we're not currently doing
    // For now, we'll log a warning
    this.logger.warn(`Revoke all tokens for user ${userId} not implemented`);
  }

  async cleanup(): Promise<number> {
    const collection = this.mongoClient
      .getDb()
      .collection(this.COLLECTION_NAME);
    const now = Date.now();
    const result = await collection.deleteMany({ expiresAt: { $lt: now } });
    this.logger.info(
      `Cleaned up ${result.deletedCount} expired blacklisted tokens`,
    );
    return result.deletedCount;
  }

  _testOnly_triggerCleanup(): Promise<number> {
    return this.cleanup();
  }
}

export default TokenBlacklistService;