// src/controllers/MetricsController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';

import type {
  IMetricsService,
  IMetricsController,
  ILogger,
} from '@/interfaces';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

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
  ) {}

  /**
   * Handles the GET request for all metrics.
   * This method sets up Server-Sent Events (SSE) for progress updates and
   * fetches metrics using the MetricsService.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {number} timePeriod - The time period in days for which to fetch metrics.
   * @returns {Promise<void>}
   *
   * @throws Will pass any errors from MetricsService to the client via SSE.
   */
  public getAllMetrics = async (
    req: Request,
    res: Response,
    timePeriod: number,
  ): Promise<void> => {
    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const progressCallback: ProgressCallback = (
      current: number,
      total: number,
      message: string,
    ) => {
      sendEvent('progress', {
        progress: Math.min(Math.round((current / total) * 100), 100),
        message,
      });
    };

    try {
      const result = await this.metricsService.getAllMetrics(
        progressCallback,
        timePeriod,
      );

      sendEvent('result', {
        success: true,
        data: result.metrics,
        errors: result.errors,
        githubStats: result.githubStats,
        status: result.errors.length > 0 ? 207 : 200,
      });
    } catch (error) {
      this.logger.error('Error in MetricsController:', error as Error);
      sendEvent('error', {
        success: false,
        errors: [
          {
            source: 'MetricsController',
            message:
              error instanceof Error
                ? error.message
                : 'An unknown error occurred',
          },
        ],
        status: 500,
      });
    } finally {
      res.end();
    }
  };
}
