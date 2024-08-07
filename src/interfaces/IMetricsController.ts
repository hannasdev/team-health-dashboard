import { Request, Response } from 'express';

export interface IMetricsController {
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
  getAllMetrics(req: Request, res: Response, timePeriod: number): Promise<void>;
}
