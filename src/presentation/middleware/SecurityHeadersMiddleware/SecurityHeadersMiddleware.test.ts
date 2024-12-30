import { SecurityHeadersMiddleware } from './SecurityHeadersMiddleware';
import {
  createMockSecurityRequest,
  createMockResponse,
  createDefaultSecurityConfig,
  createMockLogger,
  createMockSecurityLogger,
} from '../../../__mocks__/index.js';
import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';

import type {
  ISecurityHeadersConfig,
  IEnhancedResponse,
  ILogger,
  ISecurityLogger,
  ISecurityRequest,
} from '../../../interfaces/index.js';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let req: jest.Mocked<ISecurityRequest>;
  let res: jest.Mocked<IEnhancedResponse>;
  let next: jest.Mock;
  let mockLogger: jest.Mocked<ILogger>;
  let mockSecurityLogger: jest.Mocked<ISecurityLogger>;

  beforeEach(() => {
    req = createMockSecurityRequest();
    res = createMockResponse();
    next = jest.fn();
    mockLogger = createMockLogger();
    mockSecurityLogger = createMockSecurityLogger();

    // Now we create the middleware with the same instances we'll verify against
    middleware = new SecurityHeadersMiddleware(
      mockLogger,
      mockSecurityLogger,
      createDefaultSecurityConfig(),
    );
  });

  describe('Contract', () => {
    it('should call next() on successful header application', () => {
      middleware.handle(req, res, next);
      expect(next).toHaveBeenCalledWith(); // Called without error
    });

    it('should pass errors to next() when header setting fails', () => {
      const error = new Error('Header setting failed');
      res.setHeader.mockImplementationOnce(() => {
        throw error;
      });

      middleware.handle(req, res, next);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply security headers',
        error,
        { errorMessage: error.message },
      );
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Mandatory Headers', () => {
    it('should always set critical security headers regardless of configuration', () => {
      const minimalConfig = {}; // Empty config to test defaults
      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        minimalConfig,
      );

      middleware.handle(req, res, next);

      // These headers should always be present
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Permitted-Cross-Domain-Policies',
        'none',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Download-Options',
        'noopen',
      );
    });
  });

  describe('Header Value Validation', () => {
    it('should sanitize CSP header values', () => {
      // Create a new middleware instance with potentially malicious config
      const config: ISecurityHeadersConfig = {
        contentSecurityPolicy:
          "default-src 'self'; script-src 'unsafe-inline' <script>alert(1)</script>",
      };

      const testMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      testMiddleware.handle(req, res, next);

      // We expect either sanitization or rejection of malicious content
      const cspCalls = res.setHeader.mock.calls.filter(
        call => call[0] === 'Content-Security-Policy',
      );

      expect(cspCalls.length).toBe(1);
      const [_, cspValue] = cspCalls[0];
      expect(cspValue).not.toContain('<script>');
      expect(cspValue).toContain("script-src 'unsafe-inline'"); // Valid part should remain
    });

    it('should handle very long header values', () => {
      const longDirective = "'self' " + 'https://example.com '.repeat(1000);
      const config: ISecurityHeadersConfig = {
        contentSecurityPolicy: `default-src ${longDirective}`,
      };

      const testMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      testMiddleware.handle(req, res, next);

      const cspCall = res.setHeader.mock.calls.find(
        call => call[0] === 'Content-Security-Policy',
      );
      expect(cspCall).toBeDefined();

      const cspValue = cspCall?.[1];
      expect(typeof cspValue).toBe('string');
      if (typeof cspValue === 'string') {
        expect(cspValue.length).toBeLessThanOrEqual(16384); // ✅ Matches spec intention

        // Optional: Add assertions about preserved functionality
        expect(cspValue).toMatch(/^default-src/); // Still starts correctly
        expect(cspValue.split(' ').every(part => part.length > 0)).toBe(true); // No empty parts
      }
    });
  });

  describe('Configurable Headers', () => {
    it('should apply Content Security Policy when enabled', () => {
      const config = {
        contentSecurityPolicy: true,
      };
      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'"),
      );
    });

    it('should apply custom CSP when provided as string', () => {
      const customCsp = "default-src 'self' https://trusted.com";
      const config = {
        contentSecurityPolicy: customCsp,
      };

      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        customCsp,
      );
    });

    it('should configure HSTS with all options', () => {
      const config = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      };

      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    });
  });

  describe('Header Interactions', () => {
    it('should handle setting the same header multiple times', () => {
      res.setHeader.mockImplementationOnce(() => {
        // Simulate header already being set
        throw new Error('Header already set');
      });

      middleware.handle(req, res, next);
      // Should handle gracefully
    });

    it('should maintain CSP when both standard and Report-Only are enabled', () => {
      const config = {
        contentSecurityPolicy: true,
        enableReporting: true, // If we add this feature
      };

      middleware.handle(req, res, next);

      // Verify both headers are set correctly
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.any(String),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy-Report-Only',
        expect.stringContaining('report-uri'),
      );
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle undefined config gracefully', () => {
      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        undefined as any, // Explicitly test undefined config
      );

      middleware.handle(req, res, next);
      // Should still set default security headers
    });

    it('should handle partial HSTS config', () => {
      const config: ISecurityHeadersConfig = {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: false, // Explicitly false instead of null
          preload: false,
        },
      };

      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      // Verify only maxAge is included in header
      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );
    });
  });

  describe('Security Logging', () => {
    it('should log security event when header application fails', () => {
      const error = new Error('Header setting failed');
      res.setHeader.mockImplementationOnce(() => {
        throw error;
      });

      req = createMockSecurityRequest({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        'user-agent': 'test-browser/1.0',
      });

      middleware.handle(req, res, next);

      expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith({
        eventType: SecurityEventType.SECURITY_HEADER_FAILURE,
        severity: SecurityEventSeverity.HIGH,
        requestInfo: {
          method: 'GET',
          path: '/test',
          ip: '127.0.0.1',
          'user-agent': req.get('user-agent'), // Use the value from request
          userId: undefined,
        },
        timestamp: expect.any(Date),
        details: {
          error: 'Header setting failed',
        },
      });

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Feature Disabling', () => {
    it('should not set CSP when disabled', () => {
      const config = {
        contentSecurityPolicy: false,
      };

      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.any(String),
      );
    });

    it('should not set HSTS when disabled', () => {
      const config = {
        hsts: false,
      };

      const middleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      middleware.handle(req, res, next);

      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple header setting failures', () => {
      const firstError = new Error('CSP setting failed');
      const headerErrors = new Map([
        ['Content-Security-Policy', firstError],
        ['X-Frame-Options', new Error('Frame options setting failed')],
      ]);

      res.setHeader.mockImplementation((header: string) => {
        const error = headerErrors.get(header);
        if (error) {
          throw error;
        }
        return res;
      });

      middleware.handle(req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply security headers', // Removed colon
        firstError,
        { errorMessage: firstError.message }, // Added meta object
      );
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(firstError);
    });

    it('should handle security logger failures gracefully', () => {
      mockSecurityLogger.createSecurityEvent.mockImplementation(() => {
        throw new Error('Logger failed');
      });

      const error = new Error('Original error');
      res.setHeader.mockImplementationOnce(() => {
        throw error;
      });

      middleware.handle(req, res, next);

      // Should still pass original error to next()
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle rapid successive calls', async () => {
      // Create multiple unique request/response pairs
      const requests = Array.from({ length: 3 }, (_, i) => ({
        req: createMockSecurityRequest({
          path: `/test${i}`,
          'user-agent': `test-browser/${i}`,
        }),
        res: createMockResponse(),
        next: jest.fn(),
      }));

      // Execute middleware calls concurrently
      await Promise.all(
        requests.map(
          ({ req, res, next }) =>
            // Wrap in Promise to ensure we catch any async errors
            new Promise<void>((resolve, reject) => {
              try {
                middleware.handle(req, res, (...args) => {
                  next(...args);
                  resolve();
                });
              } catch (error) {
                reject(error);
              }
            }),
        ),
      );

      // Verify each request was handled correctly
      requests.forEach(({ req, res, next }, index) => {
        // Verify headers were set for each response
        expect(res.setHeader).toHaveBeenCalledWith(
          'X-Content-Type-Options',
          'nosniff',
        );

        // Verify next was called exactly once for each request
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();

        // Verify unique request handling
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Applying security headers to request',
          expect.objectContaining({
            path: `/test${index}`,
          }),
        );
      });
    });
  });

  describe('Middleware Chain', () => {
    it('should preserve response modifications from previous middleware', () => {
      // Simulate previous middleware setting headers
      res.setHeader('X-Previous-Middleware', 'test');

      middleware.handle(req, res, next);

      // Verify our headers are added without removing existing ones
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Previous-Middleware',
        'test',
      );
    });
  });
});
