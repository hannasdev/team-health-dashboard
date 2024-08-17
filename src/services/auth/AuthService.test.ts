// src/services/__tests__/AuthService.test.ts

import { AuthService } from './AuthService.js';
import {
  createMockJwtService,
  createMockBcryptService,
  createMockUserRepository,
  createMockLogger,
} from '../../__mocks__/mockFactories.js';
import { Config } from '../../config/config.js';
import { IConfig } from '../../interfaces/index.js';
import { User } from '../../models/User.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfig: IConfig;
  let mockJwtService: ReturnType<typeof createMockJwtService>;
  let mockBcryptService: ReturnType<typeof createMockBcryptService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = Config.getInstance({ JWT_SECRET: 'test-secret' });
    mockJwtService = createMockJwtService();
    mockBcryptService = createMockBcryptService();
    mockUserRepository = createMockUserRepository();
    mockLogger = createMockLogger();

    authService = new AuthService(
      mockConfig,
      mockJwtService,
      mockBcryptService,
      mockUserRepository,
      mockLogger,
    );
  });

  describe('validateToken', () => {
    it('should return decoded token payload', () => {
      const mockPayload = { id: '1', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = authService.validateToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-secret',
      );
    });

    it('should throw an error for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.validateToken('invalid-token')).toThrow(
        'Invalid token',
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a token with the given payload', () => {
      const mockPayload = { id: '1', email: 'test@example.com' };
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = authService.generateToken(mockPayload);

      expect(result).toBe('generated-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-secret',
        { expiresIn: '1d' },
      );
    });
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const mockUser = new User('1', 'test@example.com', 'hashed-password');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcryptService.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('login-token');

      const result = await authService.login('test@example.com', 'password');

      expect(result).toBe('login-token');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockBcryptService.compare).toHaveBeenCalledWith(
        'password',
        'hashed-password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: '1', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '1d' },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successful login for user: test@example.com',
      );
    });

    it('should throw an error for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(undefined);

      await expect(
        authService.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow('Invalid credentials');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed login attempt for email: nonexistent@example.com',
      );
    });

    it('should throw an error for incorrect password', async () => {
      const mockUser = new User('1', 'test@example.com', 'hashed-password');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockBcryptService.compare.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed login attempt for email: test@example.com',
      );
    });
  });

  describe('register', () => {
    it('should create a new user and return a token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(undefined);
      mockBcryptService.hash.mockResolvedValue('hashed-password');
      const mockNewUser = new User('1', 'new@example.com', 'hashed-password');
      mockUserRepository.create.mockResolvedValue(mockNewUser);
      mockJwtService.sign.mockReturnValue('register-token');

      const result = await authService.register('new@example.com', 'password');

      expect(result).toBe('register-token');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'new@example.com',
      );
      expect(mockBcryptService.hash).toHaveBeenCalledWith('password', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        'new@example.com',
        'hashed-password',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: '1', email: 'new@example.com' },
        'test-secret',
        { expiresIn: '1d' },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'New user registered: new@example.com',
      );
    });

    it('should throw an error if user already exists', async () => {
      const existingUser = new User(
        '1',
        'existing@example.com',
        'hashed-password',
      );
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.register('existing@example.com', 'password'),
      ).rejects.toThrow('User already exists');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Registration attempt with existing email: existing@example.com',
      );
    });
  });

  describe('refreshToken', () => {
    it('should return a new token for a valid token', async () => {
      const mockPayload = { id: '1', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockJwtService.sign.mockReturnValue('refreshed-token');

      const result = await authService.refreshToken('valid-token');

      expect(result).toBe('refreshed-token');
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-secret',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-secret',
        { expiresIn: '1d' },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token refreshed for user: test@example.com',
      );
    });

    it('should throw an error for an invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('revokeToken', () => {
    it('should add the token to the blacklist', async () => {
      await authService.revokeToken('token-to-revoke');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token revoked: token-to-r...',
      );
      // Check if the token is actually blacklisted
      expect(await authService.isTokenRevoked('token-to-revoke')).toBe(true);
    });
  });

  describe('isTokenRevoked', () => {
    it('should return true for a revoked token', async () => {
      await authService.revokeToken('revoked-token');
      const result = await authService.isTokenRevoked('revoked-token');
      expect(result).toBe(true);
    });

    it('should return false for a non-revoked token', async () => {
      const result = await authService.isTokenRevoked('valid-token');
      expect(result).toBe(false);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should log the password reset initiation', async () => {
      await authService.initiatePasswordReset('test@example.com');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset initiated for test@example.com',
      );
    });
  });

  describe('resetPassword', () => {
    it('should log the password reset', async () => {
      await authService.resetPassword('reset-token', 'new-password');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset with token reset-toke...',
      );
    });
  });
});
