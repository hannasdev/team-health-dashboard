// src/routes/metrics.ts
import express from 'express';
import { MetricsController } from '../controllers/MetricsController';
import { container } from '../container';
import { TYPES } from '../utils/types';
import { IMetricsService } from '../interfaces/IMetricsService';

const router = express.Router();

// Get MetricsController from the container
const metricsController = container.get<MetricsController>(
  TYPES.MetricsController,
);

// Define route
router.get('/metrics', metricsController.getAllMetrics);

export default router;
