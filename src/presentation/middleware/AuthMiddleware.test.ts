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
} from '../../__mocks__/index.js';
import { UnauthorizedError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

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
      on: jest.fn(),
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
    it('should create SSE connection for SSE requests', async () => {
      const { req, res, next } = createMockContext({
        authHeader: 'Bearer valid_token',
        tokenValidation: {
          id: '123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        isSSE: true,
      });

      await authMiddleware.handle(req, res, next);

      expect(mockSSEService.createConnection).toHaveBeenCalledWith(
        expect.stringContaining('auth-'),
        res,
      );
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
        isSSE: true,
      });

      await authMiddleware.handle(req, res, next);

      // Fast-forward time by 1 minute
      jest.advanceTimersByTime(60000);

      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('auth-'),
        'error',
        { message: 'Token expired' },
      );
      expect(mockSSEService.endConnection).toHaveBeenCalled();

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
        isSSE: true,
      });

      await authMiddleware.handle(req, res, next);

      expect(req.on).toHaveBeenCalledWith('close', expect.any(Function));

      // Simulate client disconnect
      const closeHandler = (req.on as jest.Mock).mock.calls[0][1];
      closeHandler();

      expect(mockSSEService.handleClientDisconnection).toHaveBeenCalledWith(
        expect.stringContaining('auth-'),
      );
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
      await authMiddleware.handle(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );

      // Reset mocks
      jest.clearAllMocks();

      // Test SSE request
      req.headers.accept = 'text/event-stream';
      res.headersSent = true;

      await authMiddleware.handle(req, res, next);

      expect(mockSSEService.createConnection).toHaveBeenCalled();
      expect(mockSSEService.sendEvent).toHaveBeenCalledWith(
        expect.stringContaining('auth-error-'),
        'error',
        { message: 'Invalid token' },
      );
      expect(mockSSEService.endConnection).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
      );
    });
  });

  // ... (other existing tests for REST scenarios)
});
