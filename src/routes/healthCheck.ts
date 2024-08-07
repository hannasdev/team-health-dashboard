// src/routes/healthCheck.ts
import { Router } from 'express';

import { container } from '@/container';
import { HealthCheckController } from '@/controllers/HealthCheckController';
import { TYPES } from '@/utils/types';

const router = Router();

const healthCheckController = container.get<HealthCheckController>(
  TYPES.HealthCheckController,
);

router.get('/', healthCheckController.getHealth.bind(healthCheckController));

export default router;
