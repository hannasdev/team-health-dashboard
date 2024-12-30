import { RateLimitMiddleware } from './RateLimitMiddleware';

import {
  createMockSecurityRequest,
  createMockResponse,
  createMockLogger,
  createMockCacheService,
  createMockSecurityLogger,
} from '../../../__mocks__/index.js';

import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';

import type {
  IRateLimitConfig,
  IEnhancedResponse,
  ILogger,
  ICacheService,
  ISecurityLogger,
  ISecurityRequest,
} from '../../../interfaces/index.js';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let req: jest.Mocked<ISecurityRequest>;
  let res: jest.Mocked<IEnhancedResponse>;
  let next: jest.Mock;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockSecurityLogger: jest.Mocked<ISecurityLogger>;
  let defaultConfig: IRateLimitConfig;

  beforeEach(() => {
    req = createMockSecurityRequest();
    res = createMockResponse();
    next = jest.fn();
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockSecurityLogger = createMockSecurityLogger();

    defaultConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many requests, please try again later',
    };

    middleware = new RateLimitMiddleware(
      mockLogger,
      mockCacheService,
      mockSecurityLogger,
      defaultConfig,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Ensure cache state is cleared between tests
    if (mockCacheService.clear) {
      mockCacheService.clear();
    }
  });

  describe('Contract', () => {
    it('should call next() when under rate limit', async () => {
      mockCacheService.get.mockResolvedValue(1);
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should pass errors to next() when cache service fails', async () => {
      const error = new Error('Cache service error');
      mockCacheService.get.mockRejectedValue(error);
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Rate Limiting Logic', () => {
    it('should increment request count correctly', async () => {
      await middleware.handle(req, res, next);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        1,
        defaultConfig.windowMs / 1000,
      );
    });

    it('should block requests when rate limit is exceeded', async () => {
      mockCacheService.get.mockResolvedValue(defaultConfig.maxRequests + 1);
      await middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: defaultConfig.message,
        }),
      );
    });

    it('should reset count after window expires', async () => {
      mockCacheService.get.mockResolvedValue(null);
      await middleware.handle(req, res, next);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        1,
        defaultConfig.windowMs / 1000,
      );
    });
  });

  describe('Header Management', () => {
    it('should set rate limit headers correctly', async () => {
      const currentRequests = 50;
      mockCacheService.get.mockResolvedValue(currentRequests);

      await middleware.handle(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        defaultConfig.maxRequests,
      );
      // Changed expectation to account for the current request
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        defaultConfig.maxRequests - (currentRequests + 1),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number),
      );
    });

    it('should handle header setting failures gracefully', async () => {
      const error = new Error('Header setting failed');
      res.setHeader.mockImplementation(() => {
        throw error;
      });

      mockCacheService.get.mockResolvedValue(1);
      await middleware.handle(req, res, next);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Security Logging', () => {
    it('should log security event when rate limit is exceeded', async () => {
      const requestsCount = defaultConfig.maxRequests + 1;
      mockCacheService.get.mockResolvedValue(requestsCount);

      req = createMockSecurityRequest({
        ip: '1.2.3.4',
        path: '/test',
        method: 'GET',
        'user-agent': 'test-user-agent',
      });

      await middleware.handle(req, res, next);

      expect(mockSecurityLogger.createSecurityEvent).toHaveBeenCalledWith(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        {
          authorization: undefined,
          body: {},
          get: expect.any(Function),
          ip: '1.2.3.4',
          method: 'GET',
          origin: undefined,
          originalUrl: '/test',
          path: '/test',
          query: {},
          securityEvent: undefined,
          user: undefined,
          'user-agent': 'test-user-agent',
        },
        expect.objectContaining({
          limit: defaultConfig.maxRequests,
          requests: requestsCount + 1, // Account for the current request
          windowMs: defaultConfig.windowMs,
        }),
        SecurityEventSeverity.MEDIUM,
      );
    });

    it('should handle security logger failures gracefully', async () => {
      mockCacheService.get.mockResolvedValue(defaultConfig.maxRequests + 1);
      mockSecurityLogger.logSecurityEvent.mockImplementation(() => {
        throw new Error('Logger failed');
      });

      await middleware.handle(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to log rate limit security event:',
        expect.any(Error),
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error for invalid window time', () => {
      expect(() => {
        new RateLimitMiddleware(
          mockLogger,
          mockCacheService,
          mockSecurityLogger,
          { ...defaultConfig, windowMs: 0 },
        );
      }).toThrow('Invalid rate limit configuration');
    });

    it('should throw error for invalid max requests', () => {
      expect(() => {
        new RateLimitMiddleware(
          mockLogger,
          mockCacheService,
          mockSecurityLogger,
          { ...defaultConfig, maxRequests: 0 },
        );
      }).toThrow('Invalid rate limit configuration');
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent cache keys for same IP', () => {
      const key1 = middleware.getKey(
        createMockSecurityRequest({ ip: '1.2.3.4' }),
      );
      const key2 = middleware.getKey(
        createMockSecurityRequest({ ip: '1.2.3.4' }),
      );
      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different IPs', () => {
      const key1 = middleware.getKey(
        createMockSecurityRequest({ ip: '1.2.3.4' }),
      );
      const key2 = middleware.getKey(
        createMockSecurityRequest({ ip: '5.6.7.8' }),
      );
      expect(key1).not.toBe(key2);
    });
  });

  describe('Request Tracking', () => {
    beforeEach(() => {
      mockCacheService.clear();
    });

    it('should track requests accurately across multiple calls', async () => {
      // Use the actual cache implementation
      for (let i = 0; i < 3; i++) {
        await middleware.handle(req, res, next);
      }

      const setCalls = mockCacheService.set.mock.calls;
      const requestKey = 'rate_limit:127.0.0.1';

      // Get the last set call for the request counter
      const lastSetCall = setCalls.filter(call => call[0] === requestKey).pop();

      expect(lastSetCall).toBeDefined();
      expect(lastSetCall![1]).toBe(3); // Should count up to 3
      expect(lastSetCall![2]).toBe(defaultConfig.windowMs / 1000);
    });

    it('should handle concurrent requests correctly', async () => {
      const concurrentRequests = Array.from({ length: 3 }, (_, i) =>
        createMockSecurityRequest({ ip: '1.2.3.4', path: `/test${i}` }),
      );

      // Mock cache to simulate incremental counts
      let requestCount = 0;
      mockCacheService.get.mockImplementation(() =>
        Promise.resolve(requestCount++),
      );

      await Promise.all(
        concurrentRequests.map(req =>
          middleware.handle(req, createMockResponse(), jest.fn()),
        ),
      );

      // Verify cache sets were called with correct values
      const setCalls = mockCacheService.set.mock.calls.filter(
        call => call[0] === 'rate_limit:1.2.3.4',
      );

      expect(setCalls).toHaveLength(3);
      expect(setCalls.map(call => call[1])).toEqual([1, 2, 3]);
    });
  });

  describe('Error Handling', () => {
    it('should handle cache get errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache get failed'));
      await middleware.handle(req, res, next);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle cache set errors gracefully', async () => {
      mockCacheService.set.mockRejectedValue(new Error('Cache set failed'));
      await middleware.handle(req, res, next);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Remaining Requests', () => {
    it('should calculate remaining requests correctly', async () => {
      const requests = 30;
      mockCacheService.get.mockResolvedValue(requests);

      const remaining = await middleware.getRemainingRequests('test-key');
      expect(remaining).toBe(defaultConfig.maxRequests - requests);
    });

    it('should return 0 when over limit', async () => {
      mockCacheService.get.mockResolvedValue(defaultConfig.maxRequests + 10);

      const remaining = await middleware.getRemainingRequests('test-key');
      expect(remaining).toBe(0);
    });
  });
});
