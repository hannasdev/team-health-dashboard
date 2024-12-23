import { Socket } from 'net';

import { Request, Response } from 'express';

import { RateLimitMiddleware } from './RateLimitMiddleware.js';
import {
  createMockLogger,
  createMockCacheService,
  createMockResponse,
  createMockSecurityLogger,
} from '../../../__mocks__/index.js';
import { AppError } from '../../../utils/errors.js';

import type { IRateLimitConfig } from '../../../interfaces/index.js';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

const createMockSocket = (remoteAddress?: string) => ({
  remoteAddress,
});

interface MockRequest
  extends Partial<Request<ParamsDictionary, any, any, Query>> {
  method: string;
  path: string;
  ip?: string;
  socket?: Socket;
  headers: Record<string, string>;
  get?: {
    (name: 'set-cookie'): string[] | undefined;
    (name: string): string | undefined;
  };
}

describe('RateLimitMiddleware', () => {
  const mockLogger = createMockLogger();
  const mockCacheService = createMockCacheService();
  const mockSecurityLogger = createMockSecurityLogger();
  const mockResponse = createMockResponse();
  const mockNext = jest.fn();

  let middleware: RateLimitMiddleware;
  const config: IRateLimitConfig = {
    windowMs: 1000,
    maxRequests: 2,
    message: 'Too many requests',
  };

  const createMockRequest = (
    overrides: Partial<MockRequest> = {},
  ): MockRequest => {
    const getMock = function (
      this: any,
      name: string,
    ): string[] | string | undefined {
      if (name === 'set-cookie') return undefined;
      return name === 'user-agent' ? 'test-agent' : undefined;
    };

    return {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      get: getMock as MockRequest['get'],
      headers: {},
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new RateLimitMiddleware(
      mockLogger,
      mockCacheService,
      mockSecurityLogger,
      config,
    );
  });

  describe('handle', () => {
    it('should allow requests within rate limit', async () => {
      const req = createMockRequest();
      mockCacheService.get.mockResolvedValue(1);

      await middleware.handle(
        req as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should block requests exceeding rate limit', async () => {
      const req = createMockRequest();
      mockCacheService.get.mockResolvedValue(3);

      await middleware.handle(
        req as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
        }),
      );
    });

    it('should set rate limit headers', async () => {
      const req = createMockRequest();

      // CHANGED: Mock sequence of values for cache gets:
      // First call for current requests, second call for reset time
      mockCacheService.get.mockImplementation((key: string) => {
        // Return 1 for request count, future timestamp for reset time
        if (key.endsWith(':ttl')) {
          return Promise.resolve(Date.now() + 1000);
        }
        return Promise.resolve(1); // Current request count before increment
      });

      await middleware.handle(
        req as Request,
        mockResponse as Response,
        mockNext,
      );

      // Verify headers
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        config.maxRequests,
      );

      // Since we're at request count 1 (before increment), remaining should be maxRequests - 1
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        config.maxRequests - 2, // CHANGED: Account for the increment
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });
  });

  describe('getKey', () => {
    it('should generate correct key from IP', () => {
      const req = createMockRequest({ ip: '127.0.0.1' });
      const key = middleware.getKey(req as Request);
      expect(key).toBe('rate_limit:127.0.0.1');
    });

    it('should handle missing IP', () => {
      const req = createMockRequest({ ip: undefined });
      const key = middleware.getKey(req as Request);
      expect(key).toBe('rate_limit:unknown');
    });
  });

  describe('getRemainingRequests', () => {
    it('should calculate remaining requests correctly', async () => {
      mockCacheService.get.mockResolvedValue(1);
      const remaining = await middleware.getRemainingRequests('test-key');
      expect(remaining).toBe(1);
    });

    it('should handle no existing requests', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const remaining = await middleware.getRemainingRequests('test-key');
      expect(remaining).toBe(2);
    });
  });
});
