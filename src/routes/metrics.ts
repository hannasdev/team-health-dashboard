// src/routes/metrics.ts
import { Response, Router } from 'express';

import { container } from '@/container';
import { MetricsController } from '@/controllers/MetricsController';
import { IAuthRequest, IAuthMiddleware } from '@/interfaces';
import { TYPES } from '@/utils/types';

const router = Router();
const metricsController = container.get<MetricsController>(
  TYPES.MetricsController,
);
const authMiddleware = container.get<IAuthMiddleware>(TYPES.AuthMiddleware);

router.get(
  '/metrics',
  authMiddleware.handle,
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

    metricsController.getAllMetrics(req, res, timePeriod);
  },
);

export default router;
