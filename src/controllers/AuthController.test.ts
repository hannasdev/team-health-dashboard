// src/controllers/AuthController.test.ts
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import {
  createMockUserRepository,
  createMockConfig,
  createMockLogger,
} from '@/__mocks__/mockFactories';
import { AuthController } from '@/controllers/AuthController';
import { IConfig, ILogger, IUserRepository } from '@/interfaces';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockConfig: jest.Mocked<IConfig>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockConfig = createMockConfig();
    mockLogger = createMockLogger();
    authController = new AuthController(
      mockUserRepository,
      mockConfig,
      mockLogger,
    );
    jest.resetAllMocks();
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

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mockToken' as never);

      await authController.register(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        'test@example.com',
        'hashedPassword',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        mockConfig.JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
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
        json: jest.fn(),
      } as unknown as Response;

      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwt, 'sign').mockReturnValue('mockToken' as never);

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        mockConfig.JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
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
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await authController.login(mockRequest, mockResponse);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
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
