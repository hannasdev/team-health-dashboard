// src/routes/metrics.ts
import { Response, Router } from 'express';

import { container } from '../container.js';
import { MetricsController } from '../controllers/MetricsController.js';
import { IAuthRequest, IAuthMiddleware } from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

const router = Router();

const getMetricsController = () =>
  container.get<MetricsController>(TYPES.MetricsController);

const getAuthMiddleware = () =>
  container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

router.get(
  '/metrics',
  // Delay resolving IAuthMiddleware
  (req: IAuthRequest, res: Response, next) =>
    getAuthMiddleware().handle(req, res, next),
  (req: IAuthRequest, res: Response) => {
    // Set necessary headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client closed connection');
    });

    // Parse time period from query params, default to 90 days if not provided
    const timePeriod = parseInt(req.query.timePeriod as string) || 90;

    getMetricsController().getAllMetrics(req, res, timePeriod);
  },
);

export default router;
