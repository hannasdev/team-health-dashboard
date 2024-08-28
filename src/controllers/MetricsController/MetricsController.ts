// src/controllers/MetricsController.ts
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IMetricsService,
  IMetricsController,
  ILogger,
  ISSEService,
} from '../../interfaces/index.js';

/**
 * MetricsController
 *
 * This controller handles HTTP requests related to metrics in the Team Health Dashboard.
 * It acts as an intermediary between the HTTP layer and the MetricsService,
 * processing requests, managing Server-Sent Events (SSE) for progress updates,
 * and formatting the final response.
 *
 * Key responsibilities:
 * - Handles the getAllMetrics endpoint
 * - Manages SSE for real-time progress updates
 * - Processes and formats the response from MetricsService
 * - Handles errors and sends appropriate error responses
 *
 * @injectable
 */

@injectable()
export class MetricsController implements IMetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.SSEService) private sseService: ISSEService,
  ) {}

  public getAllMetrics = async (
    req: Request,
    res: Response,
    next: NextFunction,
    timePeriod: number,
  ): Promise<void> => {
    this.logger.info('Received getAllMetrics request', {
      timePeriod,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    this.sseService.initialize(res);
    req.on('close', this.sseService.handleClientDisconnection);

    try {
      if (req.query.error === 'true') {
        throw new AppError(500, 'Simulated server error');
      }

      const result = await this.metricsService.getAllMetrics(
        this.sseService.progressCallback,
        timePeriod,
      );

      this.sseService.sendResultEvent(result);
    } catch (error) {
      this.logger.error('Error fetching metrics:', error as Error);
      this.sseService.handleError(
        error instanceof Error
          ? error
          : new AppError(500, 'Unknown error occurred'),
      );
    }
  };
}
