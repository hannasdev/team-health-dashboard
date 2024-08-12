// src/controllers/MetricsController.ts
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import type {
  IMetricsService,
  IMetricsController,
  ILogger,
  IMetric,
} from '../interfaces/index.js';
import { ProgressCallback } from '../types/index.js';
import { TYPES } from '../utils/types.js';

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
    next: NextFunction,
    timePeriod: number,
  ): Promise<void> => {
    let isClientConnected = true;

    // Handle client disconnection
    req.on('close', () => {
      isClientConnected = false;
      this.logger.info('Client disconnected');
    });

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

    const timeout = setTimeout(() => {
      if (isClientConnected) {
        const timeoutError = new Error('Operation timed out');
        timeoutError.name = 'TimeoutError';
        next(timeoutError);
      }
    }, 120000); // 2 minutes timeout

    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const result = await this.metricsService.getAllMetrics(
        progressCallback,
        timePeriod,
      );

      // Add type annotation if needed:
      const responseData: {
        success: true;
        data: IMetric[];
        errors: { source: string; message: string }[];
        githubStats: {
          totalPRs: number;
          fetchedPRs: number;
          timePeriod: number;
        };
        status: number;
      } = {
        success: true,
        data: result.metrics,
        errors: result.errors,
        githubStats: result.githubStats,
        status: result.errors.length > 0 ? 207 : 200,
      };

      sendEvent('result', responseData);
    } catch (error) {
      this.logger.error('Error in MetricsController:', error as Error);
      if (isClientConnected) {
        next(error);
      }
    } finally {
      clearTimeout(timeout);
      if (isClientConnected) {
        res.end();
      }
    }
  };
}
