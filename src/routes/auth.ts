// src/routes/auth.ts
import { Router } from 'express';

import { container } from '@/container';
import { AuthController } from '@/controllers/AuthController';
import { TYPES } from '@/utils/types';

const router = Router();
const authController = container.get<AuthController>(TYPES.AuthController);

router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));

export default router;
