// src/routes/metrics.ts
import { NextFunction, Router } from 'express';

import { container } from '../../container.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';
import { MetricsController } from '../controllers/MetricsController/MetricsController.js';

import type {
  IMiddleware,
  ILogger,
  IAuthenticatedRequest,
  IEnhancedResponse,
} from '../../interfaces/index.js';

const router = Router();

const getMetricsController = () =>
  container.get<MetricsController>(TYPES.MetricsController);

const getAuthMiddleware = () =>
  container.get<IMiddleware>(TYPES.AuthMiddleware);

const getLogger = () => container.get<ILogger>(TYPES.Logger);

// GET /metrics endpoint
router.get(
  '/',
  (req, res, next?: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics endpoint');
    return getAuthMiddleware().handle(
      req as unknown as IAuthenticatedRequest,
      res as IEnhancedResponse,
      next as NextFunction,
    );
  },
  async (req, res, next) => {
    if (!next) {
      throw new Error('Next function is required');
    }

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
      await metricsController.getAllMetrics(
        req as unknown as IAuthenticatedRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      );
    } catch (error) {
      logger.error('Error in metrics route handler:', error as Error);
      next(error);
    }
  },
);

// POST /metrics/sync endpoint
router.post(
  '/sync',
  (req, res, next?: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics/sync endpoint');
    return getAuthMiddleware().handle(
      req as unknown as IAuthenticatedRequest,
      res as IEnhancedResponse,
      next as NextFunction,
    );
  },
  async (req, res, next) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    const logger = getLogger();
    try {
      logger.debug('Initiating metrics sync');

      const metricsController = getMetricsController();
      if (!metricsController) {
        logger.error('MetricsController not found in container');
        return next(new AppError(500, 'Internal server error'));
      }

      logger.debug('Calling syncMetrics on MetricsController');
      await metricsController.syncMetrics(
        req as unknown as IAuthenticatedRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      );
    } catch (error) {
      logger.error('Error in metrics sync route handler:', error as Error);
      next(error);
    }
  },
);

router.post(
  '/reset-database',
  (req, res, next?: NextFunction) => {
    const logger = getLogger();
    logger.debug('Accessing /metrics/reset-database endpoint');
    return getAuthMiddleware().handle(
      req as unknown as IAuthenticatedRequest,
      res,
      next as NextFunction,
    );
  },
  async (req, res, next) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    const logger = getLogger();
    try {
      logger.debug('Initiating database reset');

      const metricsController = getMetricsController();
      if (!metricsController) {
        logger.error('MetricsController not found in container');
        return next(new AppError(500, 'Internal server error'));
      }

      logger.debug('Calling resetDatabase on MetricsController');
      await metricsController.resetDatabase(
        req as unknown as IAuthenticatedRequest,
        res as IEnhancedResponse,
        next as NextFunction,
      );
    } catch (error) {
      logger.error('Error in database reset route handler:', error as Error);
      next(error);
    }
  },
);

export default router;
