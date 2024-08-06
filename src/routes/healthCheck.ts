// src/routes/healthCheck.ts
import express from 'express';

import { container } from '@/container';
import { HealthCheckController } from '@/controllers/HealthCheckController';
import { TYPES } from '@/utils/types';

const router = express.Router();

const healthCheckController = container.get<HealthCheckController>(
  TYPES.HealthCheckController,
);

router.get('/', healthCheckController.getHealth.bind(healthCheckController));

export default router;
