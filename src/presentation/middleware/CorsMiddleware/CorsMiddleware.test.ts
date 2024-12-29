import { CorsMiddleware } from './CorsMiddleware.js';
import {
  createMockRequest,
  createMockResponse,
  createMockLogger,
} from '../../../__mocks__/index.js';

import type {
  IEnhancedRequest,
  IEnhancedResponse,
  ILogger,
  IConfig,
} from '../../../interfaces/index.js';

describe('CorsMiddleware', () => {
  let middleware: CorsMiddleware;
  let req: jest.Mocked<IEnhancedRequest>;
  let res: jest.Mocked<IEnhancedResponse>;
  let next: jest.Mock;
  let mockLogger: jest.Mocked<ILogger>;
  let mockConfig: jest.Mocked<IConfig>;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
    mockLogger = createMockLogger();
    mockConfig = {
      CORS_ORIGIN: 'http://localhost:3000,http://example.com',
    } as jest.Mocked<IConfig>;

    middleware = new CorsMiddleware(mockConfig, mockLogger);
  });

  describe('Contract', () => {
    it('should call next() after setting headers', () => {
      middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should end the response for OPTIONS requests', () => {
      req.method = 'OPTIONS';
      middleware.handle(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith('');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Origin Handling', () => {
    it('should allow requests from configured origins', () => {
      req.headers.origin = 'http://localhost:3000';
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000',
      );
    });

    it('should handle multiple configured origins', () => {
      req.headers.origin = 'http://example.com';
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://example.com',
      );
    });

    it('should handle wildcard origin configuration', () => {
      mockConfig.CORS_ORIGIN = '*';
      middleware = new CorsMiddleware(mockConfig, mockLogger);

      req.headers.origin = 'http://unknown-domain.com';
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://unknown-domain.com',
      );
    });

    it('should handle requests without origin header when wildcard is allowed', () => {
      mockConfig.CORS_ORIGIN = '*';
      middleware = new CorsMiddleware(mockConfig, mockLogger);

      delete req.headers.origin;
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*',
      );
    });

    it('should not set CORS headers for disallowed origins', () => {
      req.headers.origin = 'http://malicious-site.com';
      middleware.handle(req, res, next);
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        expect.any(String),
      );
    });
  });

  describe('CORS Headers', () => {
    beforeEach(() => {
      req.headers.origin = 'http://localhost:3000';
    });

    it('should set allowed methods', () => {
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.stringContaining('GET'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.stringContaining('POST'),
      );
    });

    it('should set allowed headers', () => {
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.stringContaining('Content-Type'),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.stringContaining('Authorization'),
      );
    });

    it('should set credentials allowed', () => {
      middleware.handle(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true',
      );
    });
  });

  describe('Configuration Handling', () => {
    it('should handle empty CORS_ORIGIN configuration', () => {
      mockConfig.CORS_ORIGIN = '';
      middleware = new CorsMiddleware(mockConfig, mockLogger);

      req.headers.origin = 'http://example.com';
      middleware.handle(req, res, next);
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        expect.any(String),
      );
    });

    it('should handle malformed CORS_ORIGIN configuration', () => {
      mockConfig.CORS_ORIGIN = 'invalid,,,config,,';
      middleware = new CorsMiddleware(mockConfig, mockLogger);

      req.headers.origin = 'http://example.com';
      middleware.handle(req, res, next);
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        expect.any(String),
      );
    });
  });

  describe('Error Handling', () => {
    it('should pass errors to next middleware', () => {
      // Arrange
      req.headers.origin = 'http://localhost:3000';
      const errorMessage = 'Test error';

      res.setHeader.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      // Act
      middleware.handle(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage,
        }),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply CORS headers:',
        expect.objectContaining({
          message: errorMessage,
        }),
      );
    });
  });

  describe('Logging', () => {
    it('should log info at initialization only', () => {
      // Clear any existing mock calls
      mockLogger.info.mockClear();

      // Create new instance to trigger initialization logging
      new CorsMiddleware(mockConfig, mockLogger);

      // Verify initialization log
      expect(mockLogger.info).toHaveBeenCalledWith(
        'CORS middleware initialized',
        expect.objectContaining({
          corsOrigin: mockConfig.CORS_ORIGIN,
        }),
      );

      // Clear logs and make a request
      mockLogger.info.mockClear();
      req.headers.origin = 'http://localhost:3000';
      middleware.handle(req, res, next);

      // Verify no additional logging during request handling
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid successive calls', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => {
        const req = createMockRequest();
        req.headers.origin = 'http://localhost:3000';
        return {
          req,
          res: createMockResponse(),
          next: jest.fn(),
        };
      });

      await Promise.all(
        requests.map(
          ({ req, res, next }) =>
            new Promise<void>(resolve => {
              middleware.handle(req, res, (...args) => {
                next(...args);
                resolve();
              });
            }),
        ),
      );

      requests.forEach(({ res, next }) => {
        expect(res.setHeader).toHaveBeenCalledWith(
          'Access-Control-Allow-Origin',
          'http://localhost:3000',
        );
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('Middleware Chain', () => {
    it('should preserve response modifications from previous middleware', () => {
      res.setHeader('X-Previous-Middleware', 'test');
      req.headers.origin = 'http://localhost:3000'; // Set allowed origin
      middleware.handle(req, res, next);

      // Verify previous headers remain
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Previous-Middleware',
        'test',
      );

      // Verify CORS headers are set
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.stringMatching(/GET.*POST/),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.stringMatching(/Content-Type.*Authorization/),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true',
      );
    });
  });
});
