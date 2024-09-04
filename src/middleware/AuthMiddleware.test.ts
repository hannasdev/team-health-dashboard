// src/middleware/AuthMiddleware.test.ts
import { Response, NextFunction } from 'express';
import { Container } from 'inversify';

import { AuthMiddleware } from './AuthMiddleware';
import {
  createMockTokenService,
  createMockTokenBlacklistService,
  createMockLogger,
  createMockAuthRequest,
  createMockAuthenticationService,
  createMockSSEService,
} from '../__mocks__/index.js';
import { UnauthorizedError } from '../utils/errors';
import { TYPES } from '../utils/types';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockTokenBlacklistService: ReturnType<
    typeof createMockTokenBlacklistService
  >;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockAuthService: ReturnType<typeof createMockAuthenticationService>;
  let mockSSEService: ReturnType<typeof createMockSSEService>;
  let container: Container;

  beforeEach(() => {
    mockTokenService = createMockTokenService();
    mockTokenBlacklistService = createMockTokenBlacklistService();
    mockLogger = createMockLogger();
    mockAuthService = createMockAuthenticationService();
    mockSSEService = createMockSSEService();

    container = new Container();
    container.bind(TYPES.TokenService).toConstantValue(mockTokenService);
    container
      .bind(TYPES.TokenBlacklistService)
      .toConstantValue(mockTokenBlacklistService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind(TYPES.AuthenticationService)
      .toConstantValue(mockAuthService);
    container.bind(TYPES.SSEService).toConstantValue(mockSSEService);

    authMiddleware = container.resolve(AuthMiddleware);
  });

  const createMockContext = (options: {
    authHeader?: string;
    refreshToken?: string;
    tokenValidation?: any;
    isTokenBlacklisted?: boolean;
    isSSE?: boolean;
  }) => {
    const req = createMockAuthRequest({
      headers: {
        authorization: options.authHeader,
        accept: options.isSSE ? 'text/event-stream' : 'application/json',
      },
      cookies: { refreshToken: options.refreshToken },
    });
    const res = {
      setHeader: jest.fn(),
      cookie: jest.fn(),
      headersSent: false,
    } as unknown as Response;
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(
      options.isTokenBlacklisted || false,
    );
    mockTokenService.validateAccessToken.mockReturnValue(
      options.tokenValidation,
    );

    return { req, res, next };
  };

  describe('SSE-specific scenarios', () => {
    it('should initialize SSE connection for SSE requests', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });

      req.headers.accept = 'text/event-stream';

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockSSEService.initialize).toHaveBeenCalledWith(res);
      expect(next).toHaveBeenCalled();
    });

    it('should set up token expiration check for SSE connections', async () => {
      jest.useFakeTimers();

      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 30, // Token expires in 30 seconds
        },
      });

      req.headers.accept = 'text/event-stream';

      await authMiddleware.handle(req, res as unknown as Response, next);

      // Fast-forward time by 1 minute
      jest.advanceTimersByTime(60000);

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith('error', {
        message: 'Token expired',
      });
      expect(mockSSEService.endResponse).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should clean up on client disconnect for SSE connections', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });

      req.headers.accept = 'text/event-stream';
      req.on = jest.fn();

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));

      // Simulate client disconnect
      const closeHandler = (req.on as jest.Mock).mock.calls[0][1];
      closeHandler();

      expect(mockSSEService.handleClientDisconnection).toHaveBeenCalled();
    });

    it('should successfully authenticate user for SSE requests', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        isSSE: true,
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockSSEService.initialize).toHaveBeenCalledWith(res);
      expect(req.user).toEqual({
        id: '123',
        email: 'test@example.com',
        exp: expect.any(Number),
      });
      expect(next).toHaveBeenCalled();
    });

    it('should refresh token for SSE requests if token is about to expire', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer about_to_expire_token',
        refreshToken: 'valid_refresh_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // Token expires in 1 minute
        },
        isSSE: true,
      });

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(req.headers.authorization).toBe('Bearer new_access_token');
      expect(mockSSEService.initialize).toHaveBeenCalledWith(res);
      expect(next).toHaveBeenCalled();
    });

    it('should reject SSE connection with already expired token', async () => {
      const expiredToken = {
        id: '123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // Token expired an hour ago
      };

      const { req, res, next } = createMockContext({
        authHeader: 'Bearer expired_token',
        tokenValidation: expiredToken,
        isSSE: true,
      });

      mockTokenService.validateAccessToken.mockReturnValue(expiredToken);

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockSSEService.handleError).toHaveBeenCalledWith(
        expect.any(UnauthorizedError),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Generic Scenarios', () => {
    it('should handle authentication errors for both REST and SSE requests', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer invalid_token',
      });

      mockTokenService.validateAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Test REST request
      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );

      // Reset mocks
      jest.clearAllMocks();

      // Test SSE request
      req.headers.accept = 'text/event-stream';
      res.headersSent = true;

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockSSEService.handleError).toHaveBeenCalledWith(
        expect.any(UnauthorizedError),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );
    });
  });

  describe('REST-specific scenarios', () => {
    it('should authenticate a user with a valid token', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        id: '123',
        email: 'test@example.com',
        exp: expect.any(Number),
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'User authenticated: test@example.com',
      );
    });

    it('should reject authentication when no token is provided', async () => {
      const { req, res, next } = createMockContext({});

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Authorization header missing or invalid',
      );
    });

    it('should reject authentication with an invalid token format', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'InvalidFormat token',
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid authorization header format',
      );
    });

    it('should reject authentication with a revoked token', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer revoked_token',
        isTokenBlacklisted: true,
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Attempt to use revoked token'),
      );
    });

    it('should reject authentication with an invalid token', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer invalid_token',
      });

      mockTokenService.validateAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );
    });

    it('should reject authentication with an expired token', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer expired_token',
      });

      mockTokenService.validateAccessToken.mockImplementation(() => {
        const error: any = new Error('Token has expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );
    });

    it('should set X-Token-Expiring header if token is about to expire and no refresh token is available', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer about_to_expire_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // Token expires in 1 minute
        },
      });

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Expiring', 'true');
      expect(next).toHaveBeenCalled();
    });

    it('should refresh the token if it is about to expire and a refresh token is available', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer about_to_expire_token',
        refreshToken: 'valid_refresh_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // Token expires in 1 minute
        },
      });

      const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };

      mockAuthService.refreshToken.mockResolvedValue(newTokens);
      mockTokenService.validateAccessToken
        .mockReturnValueOnce({
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // First call returns about to expire token
        })
        .mockReturnValueOnce({
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600, // Second call returns new token
        });

      await authMiddleware.handle(req, res, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new_refresh_token',
        expect.any(Object),
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Refreshed', 'true');
      expect(req.headers.authorization).toBe('Bearer new_access_token');
      expect(next).toHaveBeenCalled();
    });

    it('should continue with the existing token if refresh fails', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer about_to_expire_token',
        refreshToken: 'invalid_refresh_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 60, // Token expires in 1 minute
        },
      });

      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Refresh failed'),
      );

      await authMiddleware.handle(req, res as unknown as Response, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'invalid_refresh_token',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to refresh token',
        expect.any(Error),
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Token-Expiring', 'true');
      expect(next).toHaveBeenCalled();
    });
  });
});
