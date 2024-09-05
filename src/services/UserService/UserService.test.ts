// src/services/user/UserService.test.ts

import { Container } from 'inversify';

import { UserService } from './UserService';
import {
  createMockUserRepository,
  createMockBcryptService,
  createMockLogger,
} from '../../__mocks__';
import { User } from '../../data/models/User';
import { UserAlreadyExistsError, UserNotFoundError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockBcryptService: ReturnType<typeof createMockBcryptService>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let container: Container;

  beforeEach(() => {
    // Create mock instances
    mockUserRepository = createMockUserRepository();
    mockBcryptService = createMockBcryptService();
    mockLogger = createMockLogger();

    // Set up the DI container
    container = new Container();
    container.bind(TYPES.UserRepository).toConstantValue(mockUserRepository);
    container.bind(TYPES.BcryptService).toConstantValue(mockBcryptService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);

    // Create an instance of UserService
    userService = container.resolve(UserService);
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      mockUserRepository.findByEmail.mockResolvedValue(undefined);
      mockBcryptService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockResolvedValue(
        new User('1', email, hashedPassword),
      );

      const result = await userService.registerUser(email, password);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockBcryptService.hash).toHaveBeenCalledWith(password, 10); // Assuming 10 is the default rounds
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        email,
        hashedPassword,
      );
      expect(result).toBeInstanceOf(User);
      expect(result.email).toBe(email);
      expect(result.password).toBe(hashedPassword);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `New user registered: ${email}`,
      );
    });

    it('should throw UserAlreadyExistsError if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      mockUserRepository.findByEmail.mockResolvedValue(
        new User('1', email, 'existingHashedPassword'),
      );

      await expect(userService.registerUser(email, password)).rejects.toThrow(
        UserAlreadyExistsError,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Registration attempt with existing email: ${email}`,
      );
    });
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const userId = '1';
      const user = new User(userId, 'test@example.com', 'hashedPassword');

      mockUserRepository.findById.mockResolvedValue(user);

      const result = await userService.getUserById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should throw UserNotFoundError when user is not found', async () => {
      const userId = 'nonexistent';

      mockUserRepository.findById.mockResolvedValue(undefined);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });
});
