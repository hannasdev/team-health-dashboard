// src/routes/metrics.ts
import { Response, Router, NextFunction } from 'express';

import { container } from '../../container.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';
import { MetricsController } from '../controllers/MetricsController/MetricsController.js';

import type {
  IAuthRequest,
  IAuthMiddleware,
  ILogger,
  IApiResponse,
} from '../../interfaces/index.js';

const router = Router();

const getMetricsController = () =>
  container.get<MetricsController>(TYPES.MetricsController);

const getAuthMiddleware = () =>
  container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

const getLogger = () => container.get<ILogger>(TYPES.Logger);

router.get(
  '/metrics',
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics endpoint');
    return getAuthMiddleware().handle(req, res, next);
  },
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const metricsController = getMetricsController();
    metricsController.setupSSE(req, res, next);
  },
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const logger = getLogger();
    try {
      const timePeriod = parseInt(req.query.timePeriod as string) || 90;
      logger.debug(`Metrics requested for time period: ${timePeriod} days`);

      const metricsController = getMetricsController();
      if (!metricsController) {
        logger.error('MetricsController not found in container');
        return next(new AppError(500, 'Internal server error'));
      }

      logger.debug('Calling getAllMetrics on MetricsController');
      return metricsController.getAllMetrics(req, res, next, timePeriod);
    } catch (error) {
      logger.error('Error in metrics route handler:', error as Error);
      next(error);
    }
  },
);

export default router;
