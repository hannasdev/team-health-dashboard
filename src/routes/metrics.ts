// src/routes/metrics.ts
import { Response, Router, NextFunction } from 'express';

import { container } from '../container.js';
import { MetricsController } from '../controllers/MetricsController/MetricsController.js';
import { IAuthRequest, IAuthMiddleware } from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

const router = Router();

const getMetricsController = () =>
  container.get<MetricsController>(TYPES.MetricsController);

const getAuthMiddleware = () =>
  container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

router.get(
  '/metrics',
  (req: IAuthRequest, res: Response, next: NextFunction) =>
    getAuthMiddleware().handle(req, res, next),
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    // Parse time period from query params, default to 90 days if not provided
    const timePeriod = parseInt(req.query.timePeriod as string) || 90;

    // Check for error query parameter
    if (req.query.error === 'true') {
      const simulatedError = new Error('Simulated error');
      simulatedError.name = 'SimulatedError';
      return next(simulatedError);
    }

    getMetricsController().getAllMetrics(req, res, next, timePeriod);
  },
);

export default router;
