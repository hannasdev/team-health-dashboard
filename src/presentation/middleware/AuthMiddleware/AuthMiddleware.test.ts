import { AuthMiddleware } from './AuthMiddleware';

import {
  createMockRequest,
  createMockResponse,
  createMockLogger,
  createMockTokenService,
  createMockTokenBlacklistService,
  createMockAuthenticationService,
} from '../../../__mocks__/index.js';

import { HeaderKeys, HeaderValues } from '../../../types/index.js';
import { UnauthorizedError } from '../../../utils/errors.js';

import type {
  IEnhancedRequest,
  IEnhancedResponse,
  ILogger,
  ITokenService,
  ITokenBlacklistService,
  IAuthenticationService,
} from '../../../interfaces/index.js';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let req: jest.Mocked<IEnhancedRequest>;
  let res: jest.Mocked<IEnhancedResponse>;
  let next: jest.Mock;
  let mockLogger: jest.Mocked<ILogger>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockTokenBlacklistService: jest.Mocked<ITokenBlacklistService>;
  let mockAuthService: jest.Mocked<IAuthenticationService>;

  const validToken = 'valid.jwt.token';
  const validDecodedToken = {
    id: '123',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
    mockLogger = createMockLogger();
    mockTokenService = createMockTokenService();
    mockTokenBlacklistService = createMockTokenBlacklistService();
    mockAuthService = createMockAuthenticationService();

    // Default successful token validation
    mockTokenService.validateAccessToken.mockReturnValue(validDecodedToken);
    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);

    middleware = new AuthMiddleware(
      mockTokenService,
      mockTokenBlacklistService,
      mockLogger,
      mockAuthService,
    );
  });

  describe('Contract', () => {
    it('should call next() on successful authentication', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should pass errors to next() when authentication fails', async () => {
      const error = new UnauthorizedError('Invalid token');
      mockTokenService.validateAccessToken.mockImplementationOnce(() => {
        throw error;
      });

      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(mockTokenService.validateAccessToken).toHaveBeenCalledWith(
        validToken,
      );
    });

    it('should handle missing Authorization header', async () => {
      req = createMockRequest({ authorization: undefined });
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No token provided',
          statusCode: 401,
        }),
      );
    });
  });

  describe('Token Validation', () => {
    it('should validate the token with TokenService', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(mockTokenService.validateAccessToken).toHaveBeenCalledWith(
        validToken,
      );
    });

    it('should check if token is blacklisted', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(mockTokenBlacklistService.isTokenBlacklisted).toHaveBeenCalledWith(
        validToken,
      );
    });

    it('should reject blacklisted tokens', async () => {
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(true);
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });

      await middleware.handle(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has been revoked',
          statusCode: 401,
        }),
      );
    });

    it('should attach decoded token data to request', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);
      expect(req.user).toEqual(validDecodedToken);
    });
  });

  describe('Token Expiration', () => {
    it('should handle tokens about to expire', async () => {
      const nearExpiryToken = {
        ...validDecodedToken,
        exp: Math.floor(Date.now() / 1000) + 240, // 4 minutes until expiry
      };
      mockTokenService.validateAccessToken.mockReturnValue(nearExpiryToken);

      const newTokens = {
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      };
      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        newTokens.refreshToken,
        expect.any(Object),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        HeaderKeys.X_TOKEN_REFRESHED,
        'true',
      );
    });

    it('should set expiring header for tokens not requiring immediate refresh', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        HeaderKeys.X_TOKEN_EXPIRING,
        'true',
      );
    });

    it('should handle token refresh failure gracefully', async () => {
      const nearExpiryToken = {
        ...validDecodedToken,
        exp: Math.floor(Date.now() / 1000) + 240,
      };
      mockTokenService.validateAccessToken.mockReturnValue(nearExpiryToken);
      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Refresh failed'),
      );

      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to refresh token',
          statusCode: 401,
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle TokenService validation errors', async () => {
      mockTokenService.validateAccessToken.mockImplementation(() => {
        throw new Error('Token validation failed');
      });

      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle TokenBlacklistService errors', async () => {
      mockTokenBlacklistService.isTokenBlacklisted.mockRejectedValue(
        new Error('Database error'),
      );

      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      await middleware.handle(req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should log authentication errors with appropriate level', async () => {
      req = createMockRequest({
        authorization: `${HeaderValues.BEARER} invalid_token`,
      });
      mockTokenService.validateAccessToken.mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      await middleware.handle(req, res, next);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
        expect.any(Object),
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        req: createMockRequest({
          path: `/test${i}`,
          authorization: `${HeaderValues.BEARER} ${validToken}`, // Set authorization when creating
        }),
        res: createMockResponse(),
        next: jest.fn(),
      }));

      await Promise.all(
        requests.map(({ req, res, next }) => middleware.handle(req, res, next)),
      );

      requests.forEach(({ next }) => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });
    });

    it('should maintain proper error context in concurrent requests', async () => {
      const validRes = createMockResponse();
      const invalidRes = createMockResponse();
      const validNext = jest.fn();
      const invalidNext = jest.fn();

      const validReq = createMockRequest({
        authorization: `${HeaderValues.BEARER} ${validToken}`,
      });
      const invalidReq = createMockRequest({
        authorization: `${HeaderValues.BEARER} invalid_token`,
      });

      mockTokenService.validateAccessToken
        .mockImplementationOnce(() => validDecodedToken)
        .mockImplementationOnce(() => {
          throw new UnauthorizedError('Invalid token');
        });

      await Promise.all([
        middleware.handle(validReq, validRes, validNext),
        middleware.handle(invalidReq, invalidRes, invalidNext),
      ]);

      expect(validNext).toHaveBeenCalledWith();
      expect(invalidNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
          statusCode: 401,
        }),
      );
    });
  });
});
