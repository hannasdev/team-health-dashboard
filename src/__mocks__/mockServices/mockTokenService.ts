import type { ITokenService } from '../../interfaces/index.js';

export function createMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn().mockImplementation((payload, expiresIn?) => {
      return `mock_access_token_${payload.id}_${expiresIn || 'default'}`;
    }),
    generateRefreshToken: jest.fn().mockImplementation(payload => {
      return `mock_refresh_token_${payload.id}`;
    }),
    generatePasswordResetToken: jest.fn().mockImplementation(payload => {
      return `mock_reset_token_${payload.id}`;
    }),
    generateShortLivedAccessToken: jest.fn().mockImplementation(payload => {
      return `mock_short_lived_token_${payload.id}`;
    }),
    validateAccessToken: jest.fn().mockImplementation(token => {
      if (token.startsWith('mock_access_token_')) {
        const [, id] = token.split('_');
        return {
          id,
          email: `${id}@example.com`,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        };
      }
      throw new Error('Invalid access token');
    }),
    validateRefreshToken: jest.fn().mockImplementation(token => {
      if (token.startsWith('mock_refresh_token_')) {
        const [, id] = token.split('_');
        return {
          id,
          exp: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
        };
      }
      throw new Error('Invalid refresh token');
    }),
    validatePasswordResetToken: jest.fn().mockImplementation(token => {
      if (token.startsWith('mock_reset_token_')) {
        const [, id] = token.split('_');
        return { id };
      }
      throw new Error('Invalid password reset token');
    }),
    decodeToken: jest.fn().mockImplementation(token => {
      const [type, id] = token.split('_');
      return {
        id,
        type: type.replace('mock_', ''),
        iat: Math.floor(Date.now() / 1000),
      };
    }),
  };
}
