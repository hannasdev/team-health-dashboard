// src/services/auth/AuthService.test.ts
import { Container } from 'inversify';

import {
  createMockConfig,
  createMockJwtService,
  createMockBcryptService,
  createMockUserRepository,
  createMockLogger,
} from '../__mocks__/mockFactories';
import {
  IConfig,
  IJwtService,
  IBcryptService,
  IUserRepository,
  ILogger,
  IAuthService,
} from '../interfaces/index.js';
import { User } from '../models/User.js';
import { AuthService } from '../services/auth/AuthService.js';
import { TYPES } from '../utils/types.js';

describe('AuthService', () => {
  let container: Container;
  let authService: IAuthService;
  let mockConfig: jest.Mocked<IConfig>;
  let mockJwtService: jest.Mocked<IJwtService>;
  let mockBcryptService: jest.Mocked<IBcryptService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockConfig.JWT_SECRET = 'test-secret';
    mockJwtService = createMockJwtService();
    mockBcryptService = createMockBcryptService();
    mockUserRepository = createMockUserRepository();
    mockLogger = createMockLogger();

    container = new Container();
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container
      .bind<IJwtService>(TYPES.JwtService)
      .toConstantValue(mockJwtService);
    container
      .bind<IBcryptService>(TYPES.BcryptService)
      .toConstantValue(mockBcryptService);
    container
      .bind<IUserRepository>(TYPES.UserRepository)
      .toConstantValue(mockUserRepository);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container.bind<IAuthService>(TYPES.AuthService).to(AuthService);

    authService = container.get<IAuthService>(TYPES.AuthService);

    jest.resetAllMocks();
  });

  describe('validateToken', () => {
    it('should return decoded token payload', () => {
      const mockPayload = { id: '1', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = authService.validateToken('valid_token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid_token',
        mockConfig.JWT_SECRET,
      );
    });

    it('should throw an error for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.validateToken('invalid_token')).toThrow(
        'Invalid token',
      );
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const mockUser = new User('1', 'test@example.com', 'hashed_password');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcryptService.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('valid_token');

      const result = await authService.login('test@example.com', 'password');

      expect(result).toEqual({
        accessToken: 'valid_token',
        refreshToken: 'valid_token',
        user: {
          id: '1',
          email: 'test@example.com',
          password: 'hashed_password',
        },
      });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockBcryptService.compare).toHaveBeenCalledWith(
        'password',
        'hashed_password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        mockConfig.JWT_SECRET,
        { expiresIn: '15m' },
      );
    });

    it('should throw an error for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for incorrect password', async () => {
      const mockUser = new User('1', 'test@example.com', 'hashed_password');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcryptService.compare.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'wrong_password'),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  // Add more test cases for other methods (register, refreshToken, etc.)
});
