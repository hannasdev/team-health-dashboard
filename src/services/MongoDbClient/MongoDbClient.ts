// src/services/database/MongoDbClient.ts
import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';

import { delay } from '../../utils/delay.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IConfig,
  ILogger,
  IMongoDbClient,
} from '../../interfaces/index.js';

@injectable()
export class MongoDbClient implements IMongoDbClient {
  private connection: mongoose.Connection | null = null;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async connect(): Promise<void> {
    if (this.connection) {
      return; // Already connected
    }

    if (!this.config.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in the configuration');
    }

    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Attempting to connect with DATABASE_URL: ${this.config.DATABASE_URL}`,
        );

        await mongoose.connect(this.config.DATABASE_URL, {
          connectTimeoutMS: this.config.MONGO_CONNECT_TIMEOUT_MS,
          serverSelectionTimeoutMS:
            this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS,
        });

        // Set up connection and handlers only after successful connection
        this.connection = mongoose.connection;
        this.setupConnectionHandlers();

        this.logger.info('Successfully connected to the database');
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

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
        await delay(this.config.DATABASE_RETRY_DELAY);
      }
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) {
      return;
    }

    this.connection.on('error', (err: Error) => {
      this.logger.error('MongoDB connection error:', err);
    });

    this.connection.on('disconnected', async () => {
      this.logger.warn('MongoDB disconnected. Attempting to reconnect...');
      try {
        await mongoose.connect(this.config.DATABASE_URL, {
          connectTimeoutMS: this.config.MONGO_CONNECT_TIMEOUT_MS,
          serverSelectionTimeoutMS:
            this.config.MONGO_SERVER_SELECTION_TIMEOUT_MS,
        });
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Max retries reached. Failed to connect to the database: ${error.message}`,
          );
          this.logger.error(
            'Error reconnecting to the database:',
            new AppError(500, `Database connection failed: ${error.message}`),
          );
        }
      }
    });
  }

  public getDb(): mongoose.Connection {
    if (!this.connection) {
      throw new AppError(500, 'Database not connected. Call connect() first.');
    }
    return this.connection;
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.logger.info('Database connection closed');
    }
  }
}
