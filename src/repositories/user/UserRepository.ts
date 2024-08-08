// src/repositories/user/UserRepository.ts
import { injectable, inject } from 'inversify';
import { MongoClient, Db } from 'mongodb';

import { IConfig, ILogger } from '@/interfaces';
import { IUserRepository } from '@/interfaces/IUserRepository';
import { User } from '@/models/User';
import { TYPES } from '@/utils/types';

@injectable()
export class UserRepository implements IUserRepository {
  private db!: Db;
  private client!: MongoClient;
  private connectionPromise: Promise<void>;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfig,
  ) {
    this.connectionPromise = this.initializeDb(); // Start connection immediately
  }

  private async initializeDb(): Promise<void> {
    try {
      this.client = await MongoClient.connect(this.config.DATABASE_URL, {
        connectTimeoutMS: this.config.MONGO_CONNECT_TIMEOUT_MS,
        serverSelectionTimeoutMS: this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS,
      });
      this.db = this.client.db();
      this.logger.info('Successfully connected to the database');
    } catch (error) {
      this.logger.error(
        'Failed to initialize database connection:',
        error as Error,
      );
      throw error;
    }
  }

  async waitForConnection(): Promise<void> {
    try {
      await this.connectionPromise; // This will propagate the error from initializeDb if it fails
    } catch (error) {
      this.logger.error('Error in waitForConnection:', error as Error);
      throw error; // Ensure the error is re-thrown
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await this.waitForConnection(); // Use waitForConnection consistently
    const user = await this.db.collection('users').findOne({ email });

    if (!user) {
      this.logger.debug(`User not found for email: ${email}`);
      return undefined;
    }

    this.logger.debug(`User found for email: ${email}`);
    return new User(user._id.toString(), user.email, user.password);
  }

  async create(email: string, password: string): Promise<User> {
    await this.waitForConnection(); // Use waitForConnection consistently
    const result = await this.db
      .collection('users')
      .insertOne({ email, password });

    this.logger.info(`New user created with email: ${email}`);
    return new User(result.insertedId.toString(), email, password);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.info('Database connection closed');
    }
  }
}
