// src/middleware/AuthMiddleware.test.ts
import { IncomingHttpHeaders } from 'http';

import { NextFunction, Response } from 'express';
import { Container } from 'inversify';
import jwt from 'jsonwebtoken'; // Add this import

import {
  createMockAuthRequest,
  createMockAuthMiddlewareResponse,
  createMockAuthService,
} from '../__mocks__/mockFactories';
import { Config } from '../config/config.js';
import {
  IAuthRequest,
  IConfig,
  IAuthMiddleware,
  IAuthService,
} from '../interfaces/index.js';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { TYPES } from '../utils/types.js';

describe('AuthMiddleware', () => {
  let mockRequest: IAuthRequest;
  let mockResponse: Response;
  let nextFunction: NextFunction;
  let mockConfig: IConfig;
  let container: Container;
  let authMiddleware: IAuthMiddleware;
  let mockJwtService: typeof jwt;
  let mockAuthService: jest.Mocked<IAuthService>;

  beforeEach(() => {
    mockRequest = createMockAuthRequest();
    mockResponse = createMockAuthMiddlewareResponse();
    mockConfig = Config.getInstance({ JWT_SECRET: 'test-secret' });
    nextFunction = jest.fn();

    mockAuthService = createMockAuthService();

    container = new Container();
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container
      .bind<IAuthService>(TYPES.AuthService)
      .toConstantValue(mockAuthService);
    container.bind<IAuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

    authMiddleware = container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

    jest.resetAllMocks();
  });

  it('should call next() if a valid token is provided', () => {
    const user = { id: '1', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer valid_token',
    } as IncomingHttpHeaders;

    mockAuthService.validateToken.mockReturnValue(user);

    authMiddleware.handle(mockRequest, mockResponse, nextFunction);

    expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid_token');
    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 401 if an invalid token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    } as IncomingHttpHeaders;

    mockAuthService.validateToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware.handle(mockRequest, mockResponse, nextFunction);

    expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid_token');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if an invalid token is provided', () => {
    const jsonMock = jest.fn();
    mockResponse.status = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest.headers = {
      authorization: 'Bearer invalid_token',
    } as IncomingHttpHeaders;

    (mockJwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware.handle(mockRequest, mockResponse, nextFunction);

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
