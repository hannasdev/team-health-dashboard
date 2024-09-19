import type { ITokenBlacklistService } from '../../interfaces/index.js';

export function createMockTokenBlacklistService(): jest.Mocked<ITokenBlacklistService> {
  return {
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    _testOnly_triggerCleanup: jest.fn(),
  };
}
