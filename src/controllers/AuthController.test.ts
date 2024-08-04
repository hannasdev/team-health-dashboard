// src/controllers/AuthController.test.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
  createMockUserRepository,
  createMockExpressRequest,
  createMockAuthControllerResponse,
} from '@/__mocks__/mockFactories';
import { config } from '@/config/config';
import { AuthController } from '@/controllers/AuthController';
import { UserRepository } from '@/repositories/user/UserRepository';

jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    authController = new AuthController(mockUserRepository);
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return a token', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

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
        config.JWT_SECRET,
        {
          expiresIn: '1h',
        },
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
    });

    it('should return 400 if user already exists', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'existing@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

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
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });
      const mockResponse = createMockAuthControllerResponse();

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
        config.JWT_SECRET,
        { expiresIn: '1h' },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mockToken' });
    });

    it('should return 401 for invalid credentials', async () => {
      const mockRequest = createMockExpressRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
      });
      const mockResponse = createMockAuthControllerResponse();

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
  });
});
