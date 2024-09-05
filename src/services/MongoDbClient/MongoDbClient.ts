// src/services/database/MongoDbClient.ts
import { injectable, inject } from 'inversify';
import { MongoClient, Db, MongoServerError } from 'mongodb';

import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IConfig,
  ILogger,
  IMongoDbClient,
} from '../../interfaces/index.js';

@injectable()
export class MongoDbClient implements IMongoDbClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Attempting to connect with DATABASE_URL: ${this.config.DATABASE_URL}`,
        );

        if (!this.config.DATABASE_URL) {
          throw new Error('DATABASE_URL is not defined in the configuration');
        }

        this.client = await MongoClient.connect(this.config.DATABASE_URL, {
          connectTimeoutMS: this.config.MONGO_CONNECT_TIMEOUT_MS,
          serverSelectionTimeoutMS:
            this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS,
        });
        this.db = this.client.db();
        this.logger.info('Successfully connected to the database');

        return;
      } catch (error) {
        let errorMessage =
          error instanceof Error ? error.message : String(error);

        if (error instanceof MongoServerError) {
          errorMessage += ` (Code: ${error.code}, CodeName: ${error.codeName})`;
          if (error.errmsg) {
            errorMessage += ` Details: ${error.errmsg}`;
          }
        }

        this.logger.warn(
          `Failed to connect to the database (attempt ${attempt}/${maxRetries}): ${errorMessage}`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            `Max retries reached. Failed to connect to the database: ${errorMessage}`,
          );
          throw new AppError(
            500,
            `Database connection failed: ${errorMessage}`,
          );
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new AppError(500, 'Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.logger.info('Database connection closed');
    }
  }
}
