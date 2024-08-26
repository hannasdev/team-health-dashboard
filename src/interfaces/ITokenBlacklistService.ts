// src/interfaces/ITokenBlacklistService.ts

export interface ITokenBlacklistService {
  blacklistToken(token: string, expiresAt: number): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  revokeAllUserTokens(userId: string): Promise<void>;
  _testOnly_triggerCleanup(): Promise<number>;
}
