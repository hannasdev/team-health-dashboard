// src/routes/healthCheck.ts
import { Router } from 'express';

import { container } from '../../container.js';
import { TYPES } from '../../utils/types.js';
import { HealthCheckController } from '../controllers/HealthCheckController/HealthCheckController.js';
import type { IEnhancedRequest } from '../../interfaces/index.js';

const router = Router();

const getHealthCheckController = () =>
  container.get<HealthCheckController>(TYPES.HealthCheckController);

router.get('/', (req, res, next) => {
  if (!next) throw new Error('Next function is required');
  getHealthCheckController().getHealth(req as IEnhancedRequest, res, next);
});

export default router;
