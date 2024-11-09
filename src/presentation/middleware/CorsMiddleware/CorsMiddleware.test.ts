import { Request, Response, NextFunction } from 'express';
import { IncomingHttpHeaders } from 'http';

import { CorsMiddleware } from './CorsMiddleware.js';
import {
  createMockConfig,
  createMockLogger,
} from '../../../__mocks__/index.js';

describe('CorsMiddleware', () => {
  let corsMiddleware: CorsMiddleware;
  let mockConfig: any;
  let mockLogger: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockLogger = createMockLogger();
    mockRequest = {
      method: 'GET',
      headers: {} as IncomingHttpHeaders,
    };

    mockResponse = {
      setHeader: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values from config', () => {
      const corsOrigin = 'http://localhost:3000,http://example.com';
      mockConfig.CORS_ORIGIN = corsOrigin;

      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'CORS middleware initialized',
        expect.objectContaining({ corsOrigin }),
      );
    });
  });

  describe('handle', () => {
    it('should set CORS headers for allowed origin', () => {
      const origin = 'http://localhost:3000';
      mockConfig.CORS_ORIGIN = origin;
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'GET',
        headers: { origin } as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        origin,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.any(String),
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        expect.any(String),
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow all origins when wildcard is configured', () => {
      mockConfig.CORS_ORIGIN = '*';
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      const origin = 'http://any-domain.com';
      mockRequest = {
        method: 'GET',
        headers: { origin } as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        origin,
      );
    });

    it('should handle multiple allowed origins', () => {
      const origins = 'http://localhost:3000,http://example.com';
      mockConfig.CORS_ORIGIN = origins;
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'GET',
        headers: { origin: 'http://example.com' } as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://example.com',
      );
    });

    it('should not set CORS headers for disallowed origin', () => {
      mockConfig.CORS_ORIGIN = 'http://allowed-domain.com';
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'GET',
        headers: {
          origin: 'http://disallowed-domain.com',
        } as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 204 for OPTIONS requests', () => {
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'OPTIONS',
        headers: {} as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.sendStatus).toHaveBeenCalledWith(204);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() for non-OPTIONS requests', () => {
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'GET',
        headers: {} as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.sendStatus).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle requests without origin header', () => {
      corsMiddleware = new CorsMiddleware(mockConfig, mockLogger);
      mockRequest = {
        method: 'GET',
        headers: {} as IncomingHttpHeaders,
      };

      corsMiddleware.handle(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
