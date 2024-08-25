// src/controllers/AuthController.test.ts
import { Request, Response, NextFunction } from 'express';

import {
  createMockUserRepository,
  createMockLogger,
} from '../__mocks__/mockFactories.js';
import { Config } from '../config/config.js';
import { AuthController } from '../controllers/AuthController.js';
import {
  IConfig,
  ILogger,
  IUserRepository,
  IBcryptService,
  IJwtService,
} from '../interfaces/index.js';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockConfig: IConfig;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBcryptService: jest.Mocked<IBcryptService>;
  let mockJwtService: jest.Mocked<IJwtService>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockConfig = Config.getInstance({ JWT_SECRET: 'test-secret' });
    mockLogger = createMockLogger();
    mockBcryptService = {
      hash: jest
        .fn()
        .mockImplementation(() => Promise.resolve('hashedPassword')),
      compare: jest.fn().mockImplementation(() => Promise.resolve(false)),
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mockToken'),
      verify: jest.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };
    mockNext = jest.fn();
    authController = new AuthController(
      mockUserRepository,
      mockConfig,
      mockLogger,
      mockBcryptService,
      mockJwtService,
    );
  });

  describe('register', () => {
    it('should create a new user and return an accessToken, refreshToken and user', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockResolvedValue(undefined);
      mockUserRepository.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      await authController.register(mockRequest, mockResponse, mockNext);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          email: 'test@example.com',
          id: '1',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      const mockRequest = {
        body: { email: 'existing@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
        password: 'hashedPassword',
      });

      await authController.register(mockRequest, mockResponse, mockNext);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User already exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with the error', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(mockError);

      await authController.register(mockRequest, mockResponse, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in register:',
        mockError,
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return a accessToken, refreshToken and user for valid credentials', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      mockBcryptService.compare.mockImplementation(() => Promise.resolve(true));

      await authController.login(mockRequest, mockResponse, mockNext);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          email: 'test@example.com',
          id: '1',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid credentials', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'wrongpassword' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      mockBcryptService.compare.mockResolvedValueOnce(false);

      await authController.login(mockRequest, mockResponse, mockNext);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with the error', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockError = new Error('Database error');
      mockUserRepository.findByEmail.mockRejectedValue(mockError);

      await authController.login(mockRequest, mockResponse, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in login:',
        mockError,
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return new access and refresh tokens for a valid refresh token', async () => {
      const mockRequest = {
        body: { refreshToken: 'validRefreshToken' },
      } as Request;
      const mockResponse = {
        json: jest.fn(),
      } as unknown as Response;

      mockJwtService.verify.mockReturnValue({
        id: '1',
        email: 'test@example.com',
      });
      mockUserRepository.findById.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });

      await authController.refreshToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: '1',
          email: 'test@example.com',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next function for an invalid refresh token', async () => {
      const mockRequest = {
        body: { refreshToken: 'invalidRefreshToken' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const tokenError = new Error('Invalid refresh token');
      mockJwtService.verify.mockImplementation(() => {
        throw tokenError;
      });

      await authController.refreshToken(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledTimes(1);

      const errorPassed = mockNext.mock.calls[0][0];

      // Use the type guard to check if errorPassed is an Error
      if (isError(errorPassed)) {
        expect(errorPassed.message).toBe('Invalid refresh token');
      } else {
        fail('Expected an Error object to be passed to next');
      }

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const mockRequest = {
        body: { refreshToken: 'validRefreshToken' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockJwtService.verify.mockReturnValue({
        id: '1',
        email: 'test@example.com',
      });
      // CHANGED: Use undefined instead of null
      mockUserRepository.findById.mockResolvedValue(undefined);

      await authController.refreshToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid refresh token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass unexpected errors to next function', async () => {
      const mockRequest = {
        body: { refreshToken: 'validRefreshToken' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const mockError = new Error('Database error');
      mockJwtService.verify.mockReturnValue({
        id: '1',
        email: 'test@example.com',
      });
      mockUserRepository.findById.mockRejectedValue(mockError);

      await authController.refreshToken(mockRequest, mockResponse, mockNext);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in refreshToken:',
        mockError,
      );
      expect(mockNext).toHaveBeenCalledWith(mockError); // CHANGED: Expect error to be passed to next
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
