// src/services/auth/AuthService.test.ts

import { Container } from 'inversify';

import { AuthService } from './AuthService';
import {
  createMockConfig,
  createMockTokenService,
  createMockTokenBlacklistService,
  createMockBcryptService,
  createMockUserRepository,
  createMockLogger,
} from '../../__mocks__/index.js';
import { Config } from '../../config/config';
import { User } from '../../models/User';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
  InvalidRefreshTokenError,
} from '../../utils/errors';
import { TYPES } from '../../utils/types';

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockTokenBlacklistService: ReturnType<
    typeof createMockTokenBlacklistService
  >;
  let mockBcryptService: ReturnType<typeof createMockBcryptService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let container: Container;

  beforeEach(() => {
    // Reset the Config singleton
    Config.resetInstance();

    // Create mock instances
    mockConfig = createMockConfig();
    mockTokenService = createMockTokenService();
    mockTokenBlacklistService = createMockTokenBlacklistService();
    mockBcryptService = createMockBcryptService();
    mockUserRepository = createMockUserRepository();
    mockLogger = createMockLogger();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.Config).toConstantValue(mockConfig);
    container.bind(TYPES.TokenService).toConstantValue(mockTokenService);
    container
      .bind(TYPES.TokenBlacklistService)
      .toConstantValue(mockTokenBlacklistService);
    container.bind(TYPES.BcryptService).toConstantValue(mockBcryptService);
    container.bind(TYPES.UserRepository).toConstantValue(mockUserRepository);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);

    // Create an instance of AuthService
    authService = container.resolve(AuthService);
  });

  describe('login', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = new User('123', email, 'hashedPassword');
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue(accessToken);
      mockTokenService.generateRefreshToken.mockReturnValue(refreshToken);

      const result = await authService.login(email, password);

      expect(result).toEqual({ user, accessToken, refreshToken });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockBcryptService.compare).toHaveBeenCalledWith(
        password,
        user.password,
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        id: user.id,
      });
    });

    it('should throw InvalidCredentialsError for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError for incorrect password', async () => {
      const user = new User('123', 'test@example.com', 'hashedPassword');
      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockBcryptService.compare.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const newUser = new User('123', email, hashedPassword);
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      mockUserRepository.findByEmail.mockResolvedValue(undefined);
      mockBcryptService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(newUser);
      mockTokenService.generateAccessToken.mockReturnValue(accessToken);
      mockTokenService.generateRefreshToken.mockReturnValue(refreshToken);

      const result = await authService.register(email, password);

      expect(result).toEqual({ user: newUser, accessToken, refreshToken });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockBcryptService.hash).toHaveBeenCalledWith(
        password,
        mockConfig.BCRYPT_ROUNDS,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        email,
        hashedPassword,
      );
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        id: newUser.id,
        email: newUser.email,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        id: newUser.id,
      });
    });

    it('should throw UserAlreadyExistsError if email is already registered', async () => {
      const existingUser = new User(
        '123',
        'existing@example.com',
        'hashedPassword',
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.register('existing@example.com', 'password123'),
      ).rejects.toThrow(UserAlreadyExistsError);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid_refresh_token';
      const userId = '123';
      const user = new User(userId, 'test@example.com', 'hashedPassword');
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      mockTokenService.validateRefreshToken.mockReturnValue({
        id: userId,
        exp: 10,
      });
      mockUserRepository.findById.mockResolvedValue(user);
      mockTokenService.decodeToken.mockReturnValue({
        exp: Date.now() / 1000 + 3600,
      });
      mockTokenService.generateAccessToken.mockReturnValue(newAccessToken);
      mockTokenService.generateRefreshToken.mockReturnValue(newRefreshToken);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
      expect(mockTokenBlacklistService.isTokenBlacklisted).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(mockTokenService.validateRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockTokenBlacklistService.blacklistToken).toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
      });
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith({
        id: user.id,
      });
    });

    it('should throw InvalidRefreshTokenError if token is blacklisted', async () => {
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(true);

      await expect(
        authService.refreshToken('blacklisted_token'),
      ).rejects.toThrow(InvalidRefreshTokenError);
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      mockTokenBlacklistService.isTokenBlacklisted.mockResolvedValue(false);
      mockTokenService.validateRefreshToken.mockReturnValue({
        id: 'nonexistent_id',
        exp: 10,
      });
      mockUserRepository.findById.mockResolvedValue(undefined);

      await expect(authService.refreshToken('valid_token')).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      const refreshToken = 'valid_refresh_token';
      mockTokenService.decodeToken.mockReturnValue({
        exp: Date.now() / 1000 + 3600,
      });

      await authService.logout(refreshToken);

      expect(mockTokenBlacklistService.blacklistToken).toHaveBeenCalledWith(
        refreshToken,
        expect.any(Number),
      );
    });
  });
});
