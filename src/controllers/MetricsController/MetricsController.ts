// src/controllers/MetricsController.ts
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { ProgressCallback } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IMetricsService,
  IMetricsController,
  ILogger,
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
    let isResponseEnded = false;

    const endResponse = () => {
      if (!isResponseEnded) {
        res.end();
        isResponseEnded = true;
      }
    };

    const handleClientDisconnection = () => {
      isClientConnected = false;
      this.logger.info('Client disconnected');
      endResponse();
    };

    const setupSSE = () => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(':\n\n');
    };

    const sendEvent = (event: string, data: any) => {
      if (isClientConnected && !isResponseEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const progressCallback: ProgressCallback = (current, total, message) => {
      sendEvent('progress', {
        progress: Math.min(Math.round((current / total) * 100), 100),
        message,
      });
    };

    const handleTimeout = () => {
      const timeoutError = new Error('Operation timed out');
      timeoutError.name = 'TimeoutError';
      handleError(timeoutError);
    };

    const handleError = (error: Error) => {
      this.logger.error('Error in MetricsController:', error);
      if (isClientConnected && !isResponseEnded) {
        sendEvent('error', {
          success: false,
          errors: [
            {
              source: 'MetricsController',
              message:
                error instanceof AppError
                  ? error.message
                  : 'An unknown error occurred',
            },
          ],
          status: error instanceof AppError ? error.statusCode : 500,
        });
        next(error);
      }
    };

    // Setup
    req.on('close', handleClientDisconnection);
    setupSSE();
    const timeout = setTimeout(handleTimeout, 120000); // 2 minutes timeout

    try {
      const result = await this.metricsService.getAllMetrics(
        progressCallback,
        timePeriod,
      );

      if (isClientConnected && !isResponseEnded) {
        sendEvent('result', {
          success: true,
          data: result.metrics,
          errors: result.errors,
          githubStats: result.githubStats,
          status: result.errors.length > 0 ? 207 : 200,
        });
        endResponse();
      }
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new AppError(500, 'Unknown error occurred'),
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
