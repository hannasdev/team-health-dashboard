// src/middleware/AuthMiddleware.test.ts
import { IncomingHttpHeaders } from 'http';

import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

import {
  createMockAuthRequest,
  createMockAuthMiddlewareResponse,
} from '@/__mocks__/mockFactories';
import { config } from '@/config/config';
import { IAuthRequest } from '@/interfaces';
import { authMiddleware } from '@/middleware/AuthMiddleware';

jest.mock('jsonwebtoken');

describe('AuthMiddleware', () => {
  let mockRequest: IAuthRequest;
  let mockResponse: Response;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = createMockAuthRequest();
    mockResponse = createMockAuthMiddlewareResponse();
    nextFunction = jest.fn();
    jest.resetAllMocks();
  });

  it('should call next() if a valid token is provided', () => {
    const user = { id: '1', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    } as IncomingHttpHeaders;
    jest.spyOn(jwt, 'verify').mockReturnValue(user as any);

    authMiddleware(mockRequest, mockResponse, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith('valid_token', config.JWT_SECRET);
    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    authMiddleware(mockRequest, mockResponse, nextFunction);

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
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(mockRequest, mockResponse, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith('invalid_token', config.JWT_SECRET);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
