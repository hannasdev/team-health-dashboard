// src/services/token/TokenService.test.ts

import { Container } from 'inversify';

import { TokenService } from './TokenService';
import {
  createMockJwtService,
  createMockConfig,
  createMockLogger,
} from '../../__mocks__/index.js';
import { Config } from '../../cross-cutting/Config/config';
import {
  InvalidResetTokenError,
  InvalidRefreshTokenError,
  UnauthorizedError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types';

describe('TokenService', () => {
  let tokenService: TokenService;
  let mockJwtService: ReturnType<typeof createMockJwtService>;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let container: Container;

  beforeEach(() => {
    // Reset the Config singleton
    Config.resetInstance();

    // Create mock instances
    mockJwtService = createMockJwtService();
    mockConfig = createMockConfig();
    mockLogger = createMockLogger();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.JwtService).toConstantValue(mockJwtService);
    container.bind(TYPES.Config).toConstantValue(mockConfig);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);

    // Create an instance of TokenService
    tokenService = container.resolve(TokenService);
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload and options', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const expectedToken = 'mocked_access_token';
      mockJwtService.sign.mockReturnValue(expectedToken);
      mockConfig.ACCESS_TOKEN_EXPIRY = '15m';

      const result = tokenService.generateAccessToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.JWT_SECRET,
        { expiresIn: '15m' },
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Generating access token'),
      );
    });

    it('should use custom expiresIn value when provided', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const customExpiresIn = '30m';
      mockJwtService.sign.mockReturnValue('custom_token');

      tokenService.generateAccessToken(payload, customExpiresIn);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.JWT_SECRET,
        { expiresIn: customExpiresIn },
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('30m'),
      );
    });

    it('should throw an error for invalid expiresIn value', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const invalidExpiresIn = 'invalid';

      expect(() =>
        tokenService.generateAccessToken(payload, invalidExpiresIn),
      ).toThrow('Invalid expiresIn value');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid expiresIn value'),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct payload and options', () => {
      const payload = { id: '123' };
      const expectedToken = 'mocked_refresh_token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = tokenService.generateRefreshToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.REFRESH_TOKEN_SECRET,
        { expiresIn: mockConfig.REFRESH_TOKEN_EXPIRY },
      );
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token with correct payload and options', () => {
      const payload = { id: '123' };
      const expectedToken = 'mocked_reset_token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = tokenService.generatePasswordResetToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.JWT_SECRET,
        { expiresIn: '1h' },
      );
    });
  });

  describe('generateShortLivedAccessToken', () => {
    it('should generate a short-lived access token with correct payload and options', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const expectedToken = 'mocked_short_lived_token';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = tokenService.generateShortLivedAccessToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        mockConfig.JWT_SECRET,
        { expiresIn: '1m' },
      );
    });
  });

  describe('validateAccessToken', () => {
    it('should validate an access token and return the payload', () => {
      const token = 'valid_access_token';
      const expectedPayload = {
        id: '123',
        email: 'test@example.com',
        exp: 1234567890,
      };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = tokenService.validateAccessToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        token,
        mockConfig.JWT_SECRET,
      );
    });

    it('should throw UnauthorizedError for invalid access token', () => {
      const token = 'invalid_access_token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.validateAccessToken(token)).toThrow(
        UnauthorizedError,
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a refresh token and return the payload', () => {
      const token = 'valid_refresh_token';
      const expectedPayload = { id: '123', exp: 1234567890 };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = tokenService.validateRefreshToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        token,
        mockConfig.REFRESH_TOKEN_SECRET,
      );
    });

    it('should throw InvalidRefreshTokenError for invalid refresh token', () => {
      const token = 'invalid_refresh_token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.validateRefreshToken(token)).toThrow(
        InvalidRefreshTokenError,
      );
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should validate a password reset token and return the payload', () => {
      const token = 'valid_reset_token';
      const expectedPayload = { id: '123' };
      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = tokenService.validatePasswordResetToken(token);

      expect(result).toEqual(expectedPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        token,
        mockConfig.JWT_SECRET,
      );
    });

    it('should throw InvalidResetTokenError for invalid reset token', () => {
      const token = 'invalid_reset_token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => tokenService.validatePasswordResetToken(token)).toThrow(
        InvalidResetTokenError,
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = 'some_token';
      const expectedDecodedToken = { id: '123', email: 'test@example.com' };
      mockJwtService.decode.mockReturnValue(expectedDecodedToken);

      const result = tokenService.decodeToken(token);

      expect(result).toEqual(expectedDecodedToken);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
    });
  });

  describe('validateExpiresIn', () => {
    it('should accept valid number of seconds', () => {
      const validExpiresIn = 3600;
      expect(() =>
        (tokenService as any).validateExpiresIn(validExpiresIn),
      ).not.toThrow();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('3600'),
      );
    });

    it('should accept valid string of seconds', () => {
      const validExpiresIn = '3600';
      expect(() =>
        (tokenService as any).validateExpiresIn(validExpiresIn),
      ).not.toThrow();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('3600'),
      );
    });

    it('should accept valid timespan string', () => {
      const validExpiresIn = '1h';
      expect(() =>
        (tokenService as any).validateExpiresIn(validExpiresIn),
      ).not.toThrow();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('1h'),
      );
    });

    it('should throw error for invalid timespan string', () => {
      const invalidExpiresIn = '1y'; // 'y' is not a valid timespan unit
      expect(() =>
        (tokenService as any).validateExpiresIn(invalidExpiresIn),
      ).toThrow('Invalid expiresIn value');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('1y'),
      );
    });

    it('should throw error for non-numeric string', () => {
      const invalidExpiresIn = 'abc';
      expect(() =>
        (tokenService as any).validateExpiresIn(invalidExpiresIn),
      ).toThrow('Invalid expiresIn value');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('abc'),
      );
    });

    it('should use the provided value when it is valid', () => {
      const validExpiresIn = '2h';
      const result = (tokenService as any).validateExpiresIn(validExpiresIn);
      expect(result).toBe('2h');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('2h'),
      );
    });
  });
});
