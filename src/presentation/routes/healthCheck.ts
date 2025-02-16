// src/routes/healthCheck.ts
import { Router } from 'express';

import { container } from '../../container.js';
import { TYPES } from '../../utils/types.js';
import { HealthCheckController } from '../controllers/HealthCheckController/HealthCheckController.js';

import type { IEnhancedRequest } from '../../presentation/middleware/interfaces/index.js';

const router = Router();

const getHealthCheckController = (): HealthCheckController =>
  container.get<HealthCheckController>(TYPES.HealthCheckController);

router.get('/', async (req, res, next) => {
  if (!next) throw new Error('Next function is required');
  await getHealthCheckController().getHealth(
    req as IEnhancedRequest,
    res,
    next,
  );
});

export default router;
