// src/routes/metrics.ts
import { Request, Response, NextFunction, Router } from 'express';

import { container } from '../../container.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';
import { MetricsController } from '../controllers/MetricsController/MetricsController.js';

import type {
  IAuthRequest,
  IAuthMiddleware,
  ILogger,
} from '../../interfaces/index.js';

const router = Router();

const getMetricsController = () =>
  container.get<MetricsController>(TYPES.MetricsController);

const getAuthMiddleware = () =>
  container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

const getLogger = () => container.get<ILogger>(TYPES.Logger);

// GET /metrics endpoint
router.get(
  '/metrics',
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics endpoint');
    return getAuthMiddleware().handle(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    const logger = getLogger();
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      logger.debug(
        `Metrics requested for page: ${page}, pageSize: ${pageSize}`,
      );

      const metricsController = getMetricsController();
      if (!metricsController) {
        logger.error('MetricsController not found in container');
        return next(new AppError(500, 'Internal server error'));
      }

      logger.debug('Calling getAllMetrics on MetricsController');
      await metricsController.getAllMetrics(req, res, next);
    } catch (error) {
      logger.error('Error in metrics route handler:', error as Error);
      next(error);
    }
  },
);

// POST /metrics/sync endpoint
router.post(
  '/metrics/sync',
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics/sync endpoint');
    return getAuthMiddleware().handle(req, res, next);
  },
  async (req: Request, res: Response, next: NextFunction) => {
    const logger = getLogger();
    try {
      logger.debug('Initiating metrics sync');

      const metricsController = getMetricsController();
      if (!metricsController) {
        logger.error('MetricsController not found in container');
        return next(new AppError(500, 'Internal server error'));
      }

      logger.debug('Calling syncMetrics on MetricsController');
      await metricsController.syncMetrics(req, res, next);
    } catch (error) {
      logger.error('Error in metrics sync route handler:', error as Error);
      next(error);
    }
  },
);

export default router;
