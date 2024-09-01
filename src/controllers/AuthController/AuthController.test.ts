// src/controllers/AuthController.test.ts
import { Container } from 'inversify';

import { AuthController } from './AuthController';
import {
  createMockAuthenticationService,
  createMockUserService,
  createMockAuthRequest,
  createMockAuthControllerResponse,
  createMockLogger,
  createMockApiResponse,
} from '../../__mocks__/';
import { User } from '../../models/User';
import {
  UserAlreadyExistsError,
  InvalidRefreshTokenError,
  InvalidInputError,
} from '../../utils/errors';
import { TYPES } from '../../utils/types';

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthenticationService: ReturnType<
    typeof createMockAuthenticationService
  >;
  let mockUserService: ReturnType<typeof createMockUserService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockApiResponse: ReturnType<typeof createMockApiResponse>;
  let container: Container;

  beforeEach(() => {
    // Create mock instances
    mockAuthenticationService = createMockAuthenticationService();
    mockUserService = createMockUserService();
    mockLogger = createMockLogger();
    mockApiResponse = createMockApiResponse();

    // Set up the DI container
    container = new Container();
    container
      .bind(TYPES.AuthenticationService)
      .toConstantValue(mockAuthenticationService);
    container.bind(TYPES.UserService).toConstantValue(mockUserService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(TYPES.ApiResponse).toConstantValue(mockApiResponse);

    // Create an instance of AuthController
    authController = container.resolve(AuthController);
  });

  describe('login', () => {
    it('should successfully log in a user', async () => {
      const req = createMockAuthRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      const mockLoginResult = {
        user: new User('1', 'test@example.com', 'hashedPassword'),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      mockAuthenticationService.login.mockResolvedValue(mockLoginResult);

      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@example.com',
          },
        },
      });

      await authController.login(req, res as any, next);

      expect(mockAuthenticationService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          id: '1',
          email: 'test@example.com',
        }),
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: expect.objectContaining({
            id: '1',
            email: 'test@example.com',
          }),
        }),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      const req = createMockAuthRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthenticationService.login.mockRejectedValue(
        new InvalidInputError('Email and password are required'),
      );

      await authController.login(req, res as any, next);

      expect(mockAuthenticationService.login).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidInputError));
    });

    it('should handle missing email or password', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.login(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidInputError));
      expect(mockAuthenticationService.login).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const req = createMockAuthRequest({
        body: { email: 'newuser@example.com', password: 'newpassword123' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      const mockUser = new User('2', 'newuser@example.com', 'hashedPassword');
      mockUserService.registerUser.mockResolvedValue(mockUser);

      const mockLoginResult = {
        user: mockUser,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      mockAuthenticationService.login.mockResolvedValue(mockLoginResult);

      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '2',
            email: 'newuser@example.com',
          },
        },
      });

      await authController.register(req, res as any, next);

      expect(mockUserService.registerUser).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpassword123',
      );
      expect(mockAuthenticationService.login).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpassword123',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          id: '2',
          email: 'newuser@example.com',
        }),
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: expect.objectContaining({
            id: '2',
            email: 'newuser@example.com',
          }),
        }),
      });
      // Ensure password is not in the response
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              password: expect.any(String),
            }),
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle registration failure due to existing user', async () => {
      const req = createMockAuthRequest({
        body: { email: 'existing@example.com', password: 'password123' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockUserService.registerUser.mockRejectedValue(
        new UserAlreadyExistsError(),
      );

      await authController.register(req, res as any, next);

      expect(mockUserService.registerUser).toHaveBeenCalledWith(
        'existing@example.com',
        'password123',
      );
      expect(next).toHaveBeenCalledWith(expect.any(UserAlreadyExistsError));
    });

    it('should handle missing email or password during registration', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.register(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidInputError));
      expect(mockUserService.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'valid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      const mockRefreshResult = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };
      mockAuthenticationService.refreshToken.mockResolvedValue(
        mockRefreshResult,
      );

      mockApiResponse.createSuccessResponse.mockReturnValue({
        success: true,
        data: mockRefreshResult,
      });

      await authController.refreshToken(req, res as any, next);

      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(mockApiResponse.createSuccessResponse).toHaveBeenCalledWith(
        mockRefreshResult,
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRefreshResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle refresh token failure', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'invalid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthenticationService.refreshToken.mockRejectedValue(
        new InvalidRefreshTokenError(),
      );

      await authController.refreshToken(req, res as any, next);

      expect(mockAuthenticationService.refreshToken).toHaveBeenCalledWith(
        'invalid_refresh_token',
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidRefreshTokenError));
    });

    it('should handle missing refresh token', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.refreshToken(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidInputError));
      expect(mockAuthenticationService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'valid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthenticationService.logout.mockResolvedValue(undefined);

      await authController.logout(req, res as any, next);

      expect(mockAuthenticationService.logout).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle logout failure', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'invalid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthenticationService.logout.mockRejectedValue(
        new Error('Logout failed'),
      );

      await authController.logout(req, res as any, next);

      expect(mockAuthenticationService.logout).toHaveBeenCalledWith(
        'invalid_refresh_token',
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing refresh token during logout', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.logout(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidInputError));
      expect(mockAuthenticationService.logout).not.toHaveBeenCalled();
    });
  });
});
