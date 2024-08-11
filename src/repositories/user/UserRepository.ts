// src/repositories/user/UserRepository.ts
import { injectable, inject } from 'inversify';
import { Collection } from 'mongodb';

import type { ILogger, IUserRepository } from '../../interfaces/index.js';
import { User } from '../../models/User.js';
import { TYPES } from '../../utils/types.js';
import { IMongoDbClient } from '../../services/database/MongoDbClient.js';

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

  async create(email: string, password: string): Promise<User> {
    const result = await this.collection.insertOne({ email, password });

    this.logger.info(`New user created with email: ${email}`);
    return new User(result.insertedId.toString(), email, password);
  }
}
