// src/controllers/AuthController.test.ts
import { Request, Response } from 'express';

import {
  createMockUserRepository,
  createMockLogger,
} from '../__mocks__/mockFactories';
import { Config } from '@/config/config';
import { AuthController } from '@/controllers/AuthController';
import {
  IConfig,
  ILogger,
  IUserRepository,
  IBcryptService,
  IJwtService,
} from '@/interfaces';

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockConfig: IConfig;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBcryptService: jest.Mocked<IBcryptService>;
  let mockJwtService: jest.Mocked<IJwtService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockConfig = Config.getInstance({ JWT_SECRET: 'test-secret' });
    mockLogger = createMockLogger();
    mockBcryptService = {
      hash: jest
        .fn()
        .mockImplementation(() => Promise.resolve('hashedPassword')),
      compare: jest.fn().mockImplementation(() => Promise.resolve(false)), // default to false
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mockToken'),
      verify: jest.fn().mockReturnValue({ id: '1', email: 'test@example.com' }),
    };
    authController = new AuthController(
      mockUserRepository,
      mockConfig,
      mockLogger,
      mockBcryptService,
      mockJwtService,
    );
  });

  describe('register', () => {
    it('should create a new user and return a token', async () => {
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

      await authController.register(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: expect.any(String),
      });
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

      await authController.register(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User already exists',
      });
    });

    it('should handle errors and return 500', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('Database error'),
      );

      await authController.register(mockRequest, mockResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in register:',
        expect.any(Error),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
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

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        token: expect.any(String),
      });
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

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
    });

    it('should handle errors and return 500', async () => {
      const mockRequest = {
        body: { email: 'test@example.com', password: 'password123' },
      } as Request;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockRejectedValue(
        new Error('Database error'),
      );

      await authController.login(mockRequest, mockResponse);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in login:',
        expect.any(Error),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });
});
