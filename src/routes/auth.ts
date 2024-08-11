// src/routes/auth.ts
import { Router } from 'express';

import { container } from '../container.js';
import { AuthController } from '../controllers/AuthController.js';
import { TYPES } from '../utils/types.js';

const router = Router();
const getAuthController = () =>
  container.get<AuthController>(TYPES.AuthController);

router.post('/login', (req, res) => getAuthController().login(req, res));
router.post('/register', (req, res) => getAuthController().register(req, res));

export default router;
