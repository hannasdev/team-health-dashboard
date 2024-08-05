// src/repositories/user/UserRepository.ts
import { injectable, inject } from 'inversify';
import { MongoClient, Db } from 'mongodb';

import { config } from '@/config/config';
import { User } from '@/models/User';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

@injectable()
export class UserRepository {
  private db!: Db;
  private client!: MongoClient;

  constructor(@inject(TYPES.Logger) private logger: Logger) {
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      this.client = await MongoClient.connect(config.DATABASE_URL);
      this.db = this.client.db();
      this.logger.info('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error as Error);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await this.ensureDbConnection();
    try {
      const user = await this.db.collection('users').findOne({ email });
      if (!user) {
        this.logger.debug(`User not found for email: ${email}`);
        return undefined;
      }
      this.logger.debug(`User found for email: ${email}`);
      return new User(user._id.toString(), user.email, user.password);
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${email}`,
        error as Error,
      );
      throw error;
    }
  }

  async create(email: string, password: string): Promise<User> {
    await this.ensureDbConnection();
    try {
      const result = await this.db
        .collection('users')
        .insertOne({ email, password });
      this.logger.info(`New user created with email: ${email}`);
      return new User(result.insertedId.toString(), email, password);
    } catch (error) {
      this.logger.error(
        `Error creating user with email: ${email}`,
        error as Error,
      );
      throw error;
    }
  }

  private async ensureDbConnection() {
    if (!this.db) {
      this.logger.warn(
        'Database connection not initialized, attempting to connect',
      );
      await this.initializeDb();
    }
  }

  // Add a method to close the database connection
  async close() {
    if (this.client) {
      await this.client.close();
      this.logger.info('Database connection closed');
    }
  }
}
