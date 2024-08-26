// src/middleware/AuthMiddleware.test.ts

import { Container } from 'inversify';

import { AuthMiddleware } from './AuthMiddleware';
import {
  createMockTokenService,
  createMockTokenBlacklistService,
  createMockLogger,
  createMockAuthRequest,
  createMockAuthMiddlewareResponse,
} from '../__mocks__/mockFactories';
import { UnauthorizedError } from '../utils/errors';
import { TYPES } from '../utils/types';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockTokenBlacklistService: ReturnType<
    typeof createMockTokenBlacklistService
  >;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let container: Container;

  beforeEach(() => {
    // Create mock instances
    mockTokenService = createMockTokenService();
    mockTokenBlacklistService = createMockTokenBlacklistService();
    mockLogger = createMockLogger();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.TokenService).toConstantValue(mockTokenService);
    container
      .bind(TYPES.TokenBlacklistService)
      .toConstantValue(mockTokenBlacklistService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);

    // Create an instance of AuthMiddleware
    authMiddleware = container.resolve(AuthMiddleware);
  });

  it('should call next() for valid token', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'Bearer valid_token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
    mockTokenService.validateAccessToken.mockReturnValue({
      id: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // Token expires in 1 hour
    });

    await authMiddleware.handle(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: '123',
      email: 'test@example.com',
      exp: expect.any(Number),
    });
  });

  it('should return 401 if no token is provided', async () => {
    const req = createMockAuthRequest();
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    await authMiddleware.handle(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token format is invalid', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'InvalidFormat token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    await authMiddleware.handle(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token has been revoked', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'Bearer revoked_token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(true);

    await authMiddleware.handle(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token has been revoked',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'Bearer invalid_token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
    mockTokenService.validateAccessToken.mockImplementation(() => {
      throw new UnauthorizedError('Invalid token');
    });

    await authMiddleware.handle(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token has expired', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'Bearer expired_token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
    mockTokenService.validateAccessToken.mockImplementation(() => {
      const error: any = new Error('Token has expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    await authMiddleware.handle(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token has expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set X-Token-Expiring header if token is about to expire', async () => {
    const req = createMockAuthRequest({
      headers: { authorization: 'Bearer about_to_expire_token' },
    });
    const res = createMockAuthMiddlewareResponse();
    const next = jest.fn();

    mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
    mockTokenService.validateAccessToken.mockReturnValue({
      id: '123',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 60, // Token expires in 1 minute
    });

    await authMiddleware.handle(req, res as any, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Token-Expiring', 'true');
    expect(next).toHaveBeenCalled();
  });
});
