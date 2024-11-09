import { Response } from 'express';
import type { Request } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import {
  createMockLogger,
  createMockResponse,
  createMockSecurityLogger,
  createMockExpressRequest,
} from '../../../__mocks__/index.js';
import { SecurityHeadersMiddleware } from './SecurityHeadersMiddleware.js';
import type { ISecurityHeadersConfig } from '../../../interfaces/index.js';

describe('SecurityHeadersMiddleware', () => {
  const mockLogger = createMockLogger();
  const mockSecurityLogger = createMockSecurityLogger();
  const mockResponse = createMockResponse();
  const mockNext = jest.fn();
  const mockRequest = createMockExpressRequest();

  let middleware: SecurityHeadersMiddleware;
  let defaultConfig: ISecurityHeadersConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create default config matching the production configuration
    defaultConfig = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      xssProtection: true,
      noSniff: true,
      frameOptions: 'DENY',
      hsts: {
        maxAge: 15552000,
        includeSubDomains: true,
        preload: true,
      },
    };

    middleware = new SecurityHeadersMiddleware(
      mockLogger,
      mockSecurityLogger,
      defaultConfig,
    );
  });

  describe('handle', () => {
    it('should allow custom CSP configuration', () => {
      const customCsp = "default-src 'self' https://example.com";
      const config: ISecurityHeadersConfig = {
        ...defaultConfig,
        contentSecurityPolicy: customCsp,
      };
      const customMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      const typedReq = mockRequest as unknown as Request<
        ParamsDictionary,
        any,
        any,
        ParsedQs,
        Record<string, any>
      >;
      customMiddleware.handle(typedReq, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        customCsp,
      );
    });

    it('should allow custom HSTS configuration', () => {
      const config: ISecurityHeadersConfig = {
        ...defaultConfig,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: false,
          preload: false,
        },
      };
      const customMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      customMiddleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000',
      );
    });

    it('should handle errors gracefully', () => {
      const req = createMockExpressRequest({
        method: 'GET',
        path: '/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      });
      const res = createMockResponse();
      const error = new Error('Test error');

      jest.spyOn(res, 'setHeader').mockImplementationOnce(() => {
        throw error;
      });

      const typedReq = req as unknown as Request<
        ParamsDictionary,
        any,
        any,
        ParsedQs,
        Record<string, any>
      >;

      expect(() =>
        middleware.handle(typedReq, res as Response, mockNext),
      ).not.toThrow();

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should disable specific headers when configured', () => {
      const config: ISecurityHeadersConfig = {
        ...defaultConfig,
        contentSecurityPolicy: false,
        xssProtection: false,
        noSniff: false,
        frameOptions: false,
        hsts: false,
      };
      const customMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      customMiddleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.any(String),
      );
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'X-XSS-Protection',
        expect.any(String),
      );
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'X-Content-Type-Options',
        expect.any(String),
      );
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'X-Frame-Options',
        expect.any(String),
      );
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String),
      );
    });

    it('should set custom frame options', () => {
      const config: ISecurityHeadersConfig = {
        ...defaultConfig,
        frameOptions: 'SAMEORIGIN',
      };
      const customMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      customMiddleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'SAMEORIGIN',
      );
    });

    it('should set referrer policy header', () => {
      middleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
    });

    it('should set download options header', () => {
      middleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Download-Options',
        'noopen',
      );
    });

    it('should set permitted cross domain policies header', () => {
      middleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Permitted-Cross-Domain-Policies',
        'none',
      );
    });

    it('should handle full HSTS configuration', () => {
      const config: ISecurityHeadersConfig = {
        ...defaultConfig,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      };
      const customMiddleware = new SecurityHeadersMiddleware(
        mockLogger,
        mockSecurityLogger,
        config,
      );

      customMiddleware.handle(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    });

    it('should set default CSP with all required directives', () => {
      middleware.handle(mockRequest, mockResponse as Response, mockNext);

      const cspCall = mockResponse.setHeader.mock.calls.find(
        call => call[0] === 'Content-Security-Policy',
      );

      expect(cspCall).toBeDefined();
      const cspHeader = cspCall ? cspCall[1] : '';

      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("style-src 'self'");
      expect(cspHeader).toContain("img-src 'self'");
      expect(cspHeader).toContain("font-src 'self'");
      expect(cspHeader).toContain("base-uri 'self'");
      expect(cspHeader).toContain("form-action 'self'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });
  });
});
