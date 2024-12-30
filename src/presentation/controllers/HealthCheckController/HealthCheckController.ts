// src/controllers/HealthCheckController/HealthCheckController.ts

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { Connection } from 'mongoose';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  ILogger,
  IHealthCheckController,
  IMongoDbClient,
  IApiResponse,
  IEnhancedRequest,
  IEnhancedResponse,
} from '../../../interfaces/index.js';
@injectable()
export class HealthCheckController implements IHealthCheckController {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.MongoDbClient) private mongoClient: IMongoDbClient,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public async getHealth(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
  ): Promise<void> {
    try {
      // Check if we can get the database object
      const connection = this.mongoClient.getDb() as Connection;

      if (!connection.db) {
        throw new Error('Database not initialized');
      }

      // Perform a simple database operation to ensure connectivity
      await connection.db.admin().ping();

      const status = 'OK';
      this.logger.info('Health check performed', { status });

      res.status(200).json(this.apiResponse.createSuccessResponse({ status }));
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      throw new AppError(503, 'Health check failed');
    }
  }
}
