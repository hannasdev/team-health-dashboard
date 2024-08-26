// src/controllers/AuthController.test.ts
import { Container } from 'inversify';

import { AuthController } from './AuthController';
import {
  createMockAuthService,
  createMockAuthRequest,
  createMockAuthControllerResponse,
  createMockLogger,
} from '../../__mocks__/mockFactories';
import { User } from '../../models/User';
import {
  UnauthorizedError,
  UserAlreadyExistsError,
  InvalidRefreshTokenError,
} from '../../utils/errors';
import { TYPES } from '../../utils/types';

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let container: Container;

  beforeEach(() => {
    // Create mock instances
    mockAuthService = createMockAuthService();
    mockLogger = createMockLogger();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.AuthService).toConstantValue(mockAuthService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);

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
        user: new User('123', 'test@example.com', 'hashedPassword'),
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };
      mockAuthService.login.mockResolvedValue(mockLoginResult);

      await authController.login(req, res as any, next);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'access_token',
            refreshToken: 'refresh_token',
            user: expect.objectContaining({
              id: '123',
              email: 'test@example.com',
            }),
          }),
        }),
      );
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

    it('should handle login failure', async () => {
      const req = createMockAuthRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedError('Invalid credentials'),
      );

      await authController.login(req, res as any, next);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle missing email or password', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.login(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const req = createMockAuthRequest({
        body: { email: 'newuser@example.com', password: 'newpassword123' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      const mockRegisterResult = {
        user: new User('456', 'newuser@example.com', 'hashedPassword'),
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };
      mockAuthService.register.mockResolvedValue(mockRegisterResult);

      await authController.register(req, res as any, next);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpassword123',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'new_access_token',
            refreshToken: 'new_refresh_token',
            user: expect.objectContaining({
              id: '456',
              email: 'newuser@example.com',
            }),
          }),
        }),
      );
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

      mockAuthService.register.mockRejectedValue(new UserAlreadyExistsError());

      await authController.register(req, res as any, next);

      expect(mockAuthService.register).toHaveBeenCalledWith(
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

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockAuthService.register).not.toHaveBeenCalled();
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
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      await authController.refreshToken(req, res as any, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'valid_refresh_token',
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockRefreshResult,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle refresh token failure', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'invalid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthService.refreshToken.mockRejectedValue(
        new InvalidRefreshTokenError(),
      );

      await authController.refreshToken(req, res as any, next);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        'invalid_refresh_token',
      );
      expect(next).toHaveBeenCalledWith(expect.any(InvalidRefreshTokenError));
    });

    it('should handle missing refresh token', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.refreshToken(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      const req = createMockAuthRequest({
        body: { refreshToken: 'valid_refresh_token' },
      });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(req, res as any, next);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
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

      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await authController.logout(req, res as any, next);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        'invalid_refresh_token',
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing refresh token during logout', async () => {
      const req = createMockAuthRequest({ body: {} });
      const res = createMockAuthControllerResponse();
      const next = jest.fn();

      await authController.logout(req, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });
});
