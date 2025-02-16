// src/services/user/UserService.ts
import { injectable, inject } from 'inversify';

import {
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type { IUserService } from './IUserService';
import type { ILogger } from '../../cross-cutting/Logger/index';
import type { IUserModel } from '../../data/models/userModel/index';
import type { IUserRepository } from '../../data/repositories/UserRepository/index';
import type { IBcryptService } from '../BcryptService/index';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async registerUser(
    email: string,
    password: string,
  ): Promise<IUserModel> {
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

  public async getUserById(id: string): Promise<IUserModel> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(`User not found for id: ${id}`);
    }
    return user;
  }

  public async updateUserProfile(
    id: string,
    data: Partial<IUserModel>,
  ): Promise<IUserModel> {
    const user = await this.getUserById(id);
    // Implement update logic here
    // For now, we'll just return the user as is
    return user;
  }
}
