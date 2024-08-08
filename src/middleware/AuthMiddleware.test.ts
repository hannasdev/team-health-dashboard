// src/middleware/AuthMiddleware.test.ts
import { IncomingHttpHeaders } from 'http';

import { NextFunction, Response } from 'express';

import {
  createMockAuthRequest,
  createMockAuthMiddlewareResponse,
} from '@/__mocks__/mockFactories';
import { Config } from '@/config/config';
import { IAuthRequest, IConfig } from '@/interfaces';
import { authMiddleware } from '@/middleware/AuthMiddleware';

describe('AuthMiddleware', () => {
  let mockRequest: IAuthRequest;
  let mockResponse: Response;
  let nextFunction: NextFunction;
  let mockConfig: IConfig;

  beforeEach(() => {
    mockRequest = createMockAuthRequest();
    mockResponse = createMockAuthMiddlewareResponse();
    mockConfig = Config.getInstance({ JWT_SECRET: 'test-secret' });
    nextFunction = jest.fn();
    jest.resetAllMocks();
  });

  it('should call next() if a valid token is provided', () => {
    const user = { id: '1', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    } as IncomingHttpHeaders;

    const mockJwtService = {
      verify: jest.fn().mockReturnValue(user),
    };
    const middleware = authMiddleware(mockConfig, mockJwtService);

    middleware(mockRequest, mockResponse, nextFunction);

    expect(mockJwtService.verify).toHaveBeenCalledWith(
      'valid_token',
      mockConfig.JWT_SECRET,
    );
    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    const middleware = authMiddleware(mockConfig); // Use default jwtService
    middleware(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'No token provided',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if an invalid token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    } as IncomingHttpHeaders;

    const mockJwtService = {
      verify: jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      }),
    };
    const middleware = authMiddleware(mockConfig, mockJwtService);

    middleware(mockRequest, mockResponse, nextFunction);

    expect(mockJwtService.verify).toHaveBeenCalledWith(
      'invalid_token',
      mockConfig.JWT_SECRET,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
