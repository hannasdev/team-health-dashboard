// src/routes/healthCheck.ts
import { Router } from 'express';

import { container } from '../../container.js';
import { TYPES } from '../../utils/types.js';
import { HealthCheckController } from '../controllers/HealthCheckController/HealthCheckController.js';

const router = Router();

const getHealthCheckController = () =>
  container.get<HealthCheckController>(TYPES.HealthCheckController);

router.get('/', (req, res) => getHealthCheckController().getHealth(req, res));

export default router;
