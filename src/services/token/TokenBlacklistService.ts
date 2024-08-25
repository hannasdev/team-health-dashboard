// src/services/token/TokenBlacklistService.ts

import { injectable, inject } from 'inversify';
import { TYPES } from '../../utils/types.js';
import {
  ITokenBlacklistService,
  ILogger,
  IConfig,
} from '../../interfaces/index.js';

@injectable()
export class TokenBlacklistService implements ITokenBlacklistService {
  private blacklist: Set<string> = new Set();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig,
  ) {
    this.cleanupInterval = setInterval(
      () => this.cleanup(),
      24 * 60 * 60 * 1000,
    ); // Clean up daily
  }

  async blacklistToken(token: string, expiresAt: number): Promise<void> {
    this.blacklist.add(`${token}:${expiresAt}`);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return Array.from(this.blacklist).some(item =>
      item.startsWith(`${token}:`),
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // In a real-world scenario, this would interact with a database
    // For now, we'll just log the action
    this.logger.info(`Revoked all tokens for user: ${userId}`);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const item of this.blacklist) {
      const [, expiresAtStr] = item.split(':');
      if (parseInt(expiresAtStr, 10) < now) {
        this.blacklist.delete(item);
      }
    }
  }
}
