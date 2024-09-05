// src/controllers/HealthCheckController/HealthCheckController.ts

import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  ILogger,
  IHealthCheckController,
  IMongoDbClient,
  IApiResponse,
} from '../../../interfaces/index.js';

@injectable()
export class HealthCheckController implements IHealthCheckController {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.MongoDbClient) private mongoClient: IMongoDbClient,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse, // ADDED: Inject ApiResponse
  ) {}

  public async getHealth(req: Request, res: Response): Promise<void> {
    try {
      // Check if we can get the database object
      const db = this.mongoClient.getDb();

      // Perform a simple database operation to ensure connectivity
      await db.command({ ping: 1 });

      const status = 'OK';
      this.logger.info('Health check performed', { status });

      res.status(200).json(this.apiResponse.createSuccessResponse({ status }));
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      throw new AppError(503, 'Health check failed');
    }
  }
}
