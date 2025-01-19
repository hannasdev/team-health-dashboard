// src/data/repositories/UserRepository/UserRepository.ts

import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';

import { UserNotFoundError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IUser,
  ILogger,
  IUserRepository,
} from '../../../interfaces/index.js';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.UserModel) private UserModel: mongoose.Model<IUser>,
  ) {}

  public async findByEmail(email: string): Promise<IUser | undefined> {
    const user = await this.UserModel.findOne({ email });

    if (!user) {
      this.logger.debug(`User not found for email: ${email}`);
      return undefined;
    }

    this.logger.debug(`User found for email: ${email}`);
    return user;
  }

  public async findById(id: string): Promise<IUser | undefined> {
    try {
      const user = await this.UserModel.findById(id);

      if (!user) {
        this.logger.debug(`User not found for id: ${id}`);
        throw new UserNotFoundError(`User not found for id: ${id}`);
      }

      this.logger.debug(`User found for id: ${id}`);
      return user;
    } catch (error) {
      if (error instanceof mongoose.Error.CastError) {
        this.logger.debug(`Invalid ObjectId: ${id}`);
        throw new UserNotFoundError(`User not found for id: ${id}`);
      }
      throw error;
    }
  }

  public async create(email: string, password: string): Promise<IUser> {
    const user = await this.UserModel.create({ email, password });

    this.logger.info(`New user created with email: ${email}`);
    return user;
  }

  public async updatePassword(id: string, newPassword: string): Promise<void> {
    const result = await this.UserModel.updateOne(
      { _id: id },
      { $set: { password: newPassword } },
    );

    if (result.modifiedCount === 0) {
      this.logger.warn(`Failed to update password for user with id: ${id}`);
      throw new UserNotFoundError(
        `Failed to update password for user with id: ${id}`,
      );
    }

    this.logger.info(`Password updated for user with id: ${id}`);
  }
}
