// src/routes/metrics.ts
import express from 'express';
import { container } from '../container';
import { MetricsController } from '@/controllers/MetricsController';
import { TYPES } from '../utils/types';

const router = express.Router();
const metricsController = container.get<MetricsController>(
  TYPES.MetricsController,
);

router.get('/metrics', (req, res) => {
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
});

export default router;
