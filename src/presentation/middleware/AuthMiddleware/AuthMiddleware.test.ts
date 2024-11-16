// src/presentation/middleware/AuthMiddleware.test.ts

import { Response, NextFunction } from 'express';
import { Container } from 'inversify';

import { AuthMiddleware } from './AuthMiddleware';
import {
  createMockTokenService,
  createMockTokenBlacklistService,
  createMockLogger,
  createMockAuthenticationService,
  createMockAuthRequest,
  createMockResponse,
} from '../../../__mocks__';
import { UnauthorizedError } from '../../../utils/errors';
import { TYPES } from '../../../utils/types';

describe('AuthMiddleware', () => {
  let container: Container;
  let authMiddleware: AuthMiddleware;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockTokenBlacklistService: ReturnType<
    typeof createMockTokenBlacklistService
  >;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockAuthenticationService: ReturnType<
    typeof createMockAuthenticationService
  >;

  beforeEach(() => {
    container = new Container();
    mockTokenService = createMockTokenService();
    mockTokenBlacklistService = createMockTokenBlacklistService();
    mockLogger = createMockLogger();
    mockAuthenticationService = createMockAuthenticationService();

    container.bind(TYPES.TokenService).toConstantValue(mockTokenService);
    container
      .bind(TYPES.TokenBlacklistService)
      .toConstantValue(mockTokenBlacklistService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind(TYPES.AuthenticationService)
      .toConstantValue(mockAuthenticationService);

    authMiddleware = container.resolve(AuthMiddleware);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should authenticate valid token and call next', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'Bearer valid_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      mockTokenService.validateAccessToken.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: '123',
        email: 'test@example.com',
        exp: expect.any(Number),
      });
    });

    it('should throw UnauthorizedError for missing token', async () => {
      const req = createMockAuthRequest();
      const res = createMockResponse();
      const next = jest.fn();

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Authentication error: No token provided',
      );
    });

    it('should throw UnauthorizedError for invalid token format', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'InvalidFormat token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Authentication error: Invalid token format',
      );
    });

    it('should throw UnauthorizedError for blacklisted token', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'Bearer blacklisted_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(true);

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Authentication error: Token has been revoked',
      );
    });

    it('should refresh token if it is about to expire', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'Bearer expiring_token' },
        query: { refreshToken: 'valid_refresh_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      mockTokenService.validateAccessToken
        .mockReturnValueOnce({
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // 1 minute to expiration
        })
        .mockReturnValueOnce({
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour to expiration
        });
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      mockAuthenticationService.refreshToken.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new_refresh_token',
        expect.any(Object),
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Refreshed', 'true');
      expect(next).toHaveBeenCalledWith();
    });

    it('should set X-Token-Expiring header if token is about to expire and no refresh token provided', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'Bearer expiring_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      mockTokenService.validateAccessToken.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 60, // 1 minute to expiration
      });
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Expiring', 'true');
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle token refresh failure', async () => {
      const req = createMockAuthRequest({
        headers: { authorization: 'Bearer expiring_token' },
        query: { refreshToken: 'invalid_refresh_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      mockTokenService.validateAccessToken.mockReturnValue({
        id: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 60, // 1 minute to expiration
      });
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      mockAuthenticationService.refreshToken.mockRejectedValue(
        new Error('Refresh failed'),
      );

      await authMiddleware.handle(
        req,
        res as unknown as Response,
        next as NextFunction,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to refresh token',
        expect.any(Error),
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
