// src/controllers/MetricsController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import type { IMetricsService } from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';

@injectable()
export class MetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
  ) {}

  public getAllMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const result: {
        metrics: IMetric[];
        errors: { source: string; message: string }[];
      } = await this.metricsService.getAllMetrics();

      if (result.errors.length > 0) {
        res.status(207).json({
          success: true,
          data: result.metrics,
          errors: result.errors,
        });
      } else {
        res.status(200).json({
          success: true,
          data: result.metrics,
        });
      }
    } catch (error) {
      console.error('Error in MetricsController:', error);
      res.status(500).json({
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
      });
    }
  };
}
