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
});
