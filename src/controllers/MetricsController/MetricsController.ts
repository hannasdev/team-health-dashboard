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
    const connectionId = `metrics-${Date.now()}`;
    this.sseService.createConnection(connectionId, res);

    const closeHandler = () => {
      this.sseService.handleClientDisconnection(connectionId);
      this.metricsService.cancelOperation();
    };

    req.on('close', closeHandler);

    try {
      if (req.query.error === 'true') {
        throw new AppError(500, 'Simulated server error');
      }

      const result = await this.metricsService.getAllMetrics(
        (current, total, message) => {
          this.sseService.sendEvent(connectionId, 'progress', {
            current,
            total,
            message,
          });
        },
        timePeriod,
      );

      this.sseService.sendEvent(connectionId, 'result', result);

      setTimeout(() => {
        this.sseService.endConnection(connectionId);
      }, 5000); // 5 seconds delay
    } catch (error) {
      this.logger.error('Error fetching metrics:', error as Error);
      this.sseService.sendEvent(connectionId, 'error', {
        message:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred while fetching metrics',
      });
      this.sseService.endConnection(connectionId);
    }
  };
}
