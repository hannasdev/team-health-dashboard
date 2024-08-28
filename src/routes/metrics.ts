// src/routes/metrics.ts
import { Response, Router, NextFunction } from 'express';

import { container } from '../container.js';
import { MetricsController } from '../controllers/MetricsController/MetricsController.js';
import { createErrorResponse } from '../utils/ApiResponse/index.js';
import { AppError } from '../utils/errors.js';
import { TYPES } from '../utils/types.js';

import type {
  IAuthRequest,
  IAuthMiddleware,
  ILogger,
} from '../interfaces/index.js';

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
    return getAuthMiddleware().handle(req, res, err => {
      if (err) {
        logger.warn('Authentication failed:', err);
        return res
          .status(401)
          .json(createErrorResponse('No token provided', 401));
      }
      next();
    });
  },
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const logger = getLogger();
    try {
      // Parse time period from query params, default to 90 days if not provided
      const timePeriod = parseInt(req.query.timePeriod as string) || 90;
      logger.debug(`Metrics requested for time period: ${timePeriod} days`);

      // Check for error query parameter
      if (req.query.error === 'true') {
        logger.warn('Simulated error triggered');
        const simulatedError = new Error('Simulated error');
        simulatedError.name = 'SimulatedError';
        return next(simulatedError);
      }

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
