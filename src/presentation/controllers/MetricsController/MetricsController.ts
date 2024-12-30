// src/controllers/MetricsController/MetricsController.ts
import { NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IMetricsService,
  IMetricsController,
  ILogger,
  IApiResponse,
  IAuthenticatedRequest,
  IEnhancedResponse,
} from '../../../interfaces/index.js';

@injectable()
export class MetricsController implements IMetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public async getAllMetrics(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Check if query parameters are present and valid before using defaults
      const pageStr = req.query?.page as string | undefined;
      const pageSizeStr = req.query?.pageSize as string | undefined;

      // Parse values
      let page = 1;
      let pageSize = 20;

      if (pageStr !== undefined) {
        const parsedPage = parseInt(pageStr);
        if (isNaN(parsedPage)) {
          throw new AppError(400, 'Invalid pagination parameters');
        }
        page = parsedPage;
      }

      if (pageSizeStr !== undefined) {
        const parsedPageSize = parseInt(pageSizeStr);
        if (isNaN(parsedPageSize)) {
          throw new AppError(400, 'Invalid pagination parameters');
        }
        pageSize = parsedPageSize;
      }

      if (page < 1 || pageSize < 1) {
        throw new AppError(400, 'Invalid pagination parameters');
      }

      this.logger.info(
        `Fetching metrics for page ${page} with page size ${pageSize}`,
      );

      const result = await this.metricsService.getAllMetrics(page, pageSize);

      if (!result) {
        throw new AppError(500, 'Metrics service returned null result');
      }

      res.json(this.apiResponse.createSuccessResponse(result));

      this.logger.info(`Successfully fetched metrics for page ${page}`);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        this.logger.error('Error fetching metrics:', error as Error);
        next(new AppError(500, 'Failed to fetch metrics'));
      }
    }
  }

  public async syncMetrics(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.logger.info('Starting metrics sync');

      await this.metricsService.syncAllData();

      res.json(
        this.apiResponse.createSuccessResponse({
          message: 'Metrics synced successfully',
        }),
      );

      this.logger.info('Metrics sync completed successfully');
    } catch (error) {
      this.logger.error('Error syncing metrics:', error as Error);
      next(new AppError(500, 'Failed to sync metrics'));
    }
  }

  public async resetDatabase(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.logger.info('Initiating database reset');
      await this.metricsService.resetAllData();
      res.json(
        this.apiResponse.createSuccessResponse({
          message: 'Database reset successfully',
        }),
      );
      this.logger.info('Database reset completed successfully');
    } catch (error) {
      this.logger.error('Error resetting database:', error as Error);
      next(new AppError(500, 'Failed to reset database'));
    }
  }
}
