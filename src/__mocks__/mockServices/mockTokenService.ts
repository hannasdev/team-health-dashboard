import type { ITokenService } from '../../interfaces/index.js';

export function createMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    generateShortLivedAccessToken: jest.fn(),
    validateAccessToken: jest.fn().mockReturnValue({
      id: 'default-id',
      email: 'default@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // Default to 1 hour from now
    }),
    validateRefreshToken: jest.fn(),
    validatePasswordResetToken: jest.fn(),
    decodeToken: jest.fn(),
  };
}
