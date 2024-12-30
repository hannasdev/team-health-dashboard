// src/services/user/UserService.ts
import { injectable, inject } from 'inversify';

import {
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IUserService,
  IUserRepository,
  IBcryptService,
  ILogger,
  IUser,
} from '../../interfaces/index.js';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  async registerUser(email: string, password: string): Promise<IUser> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new UserAlreadyExistsError();
    }
    const hashedPassword = await this.bcryptService.hash(password, 10); // You might want to move the rounds to a config
    const newUser = await this.userRepository.create(email, hashedPassword);
    this.logger.info(`New user registered: ${email}`);
    return newUser;
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(`User not found for id: ${id}`);
    }
    return user;
  }

  async updateUserProfile(id: string, data: Partial<IUser>): Promise<IUser> {
    const user = await this.getUserById(id);
    // Implement update logic here
    // For now, we'll just return the user as is
    return user;
  }
}
