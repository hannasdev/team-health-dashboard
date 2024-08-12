import { Request, Response, NextFunction } from 'express';

export interface IMetricsController {
  /**
   * Handles the GET request for all metrics.
   * This method sets up Server-Sent Events (SSE) for progress updates and
   * fetches metrics using the MetricsService.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The Express next function for error handling.
   * @param {number} timePeriod - The time period in days for which to fetch metrics.
   * @returns {Promise<void>}
   *
   * @throws Will pass any errors to the next error handling middleware.
   */
  getAllMetrics(
    req: Request,
    res: Response,
    next: NextFunction,
    timePeriod: number,
  ): Promise<void>;
}
