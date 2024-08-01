// src/controllers/MetricsController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types';
import type {
  IMetricsService,
  ProgressCallback,
} from '../interfaces/IMetricsService';
import type { IMetric } from '../interfaces/IMetricModel';
import { Logger } from '../utils/logger';

@injectable()
export class MetricsController {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: IMetricsService,
    @inject(TYPES.Logger) private logger: Logger,
  ) {}

  public getAllMetrics = async (req: Request, res: Response): Promise<void> => {
    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await this.metricsService.getAllMetrics(
        (progress: number, message: string, details?: Record<string, any>) => {
          sendEvent('progress', { progress, message, ...details });
        },
      );

      sendEvent('result', {
        success: true,
        data: result.metrics,
        errors: result.errors,
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
    }
  };
}
