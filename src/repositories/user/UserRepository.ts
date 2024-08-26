// src/repositories/user/UserRepository.ts
import { injectable, inject } from 'inversify';
import { Collection } from 'mongodb';

import { User } from '../../models/User.js';
import { UserNotFoundError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  ILogger,
  IUserRepository,
  IMongoDbClient,
} from '../../interfaces/index.js';

@injectable()
export class UserRepository implements IUserRepository {
  private collection: Collection;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.MongoDbClient) private mongoDbClient: IMongoDbClient,
  ) {
    this.collection = this.mongoDbClient.getDb().collection('users');
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.collection.findOne({ email });

    if (!user) {
      this.logger.debug(`User not found for email: ${email}`);
      return undefined;
    }

    this.logger.debug(`User found for email: ${email}`);
    return new User(user._id.toString(), user.email, user.password);
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.collection.findOne({ _id: new Object(id) });

    if (!user) {
      this.logger.debug(`User not found for id: ${id}`);
      throw new UserNotFoundError(`User not found for id: ${id}`);
    }

    this.logger.debug(`User found for id: ${id}`);
    return new User(user._id.toString(), user.email, user.password);
  }

  async create(email: string, password: string): Promise<User> {
    const result = await this.collection.insertOne({ email, password });

    this.logger.info(`New user created with email: ${email}`);
    return new User(result.insertedId.toString(), email, password);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: new Object(id) },
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
