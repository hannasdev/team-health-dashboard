// src/routes/auth.ts

import express from 'express';
import { container } from '../container';
import { AuthController } from '../controllers/AuthController';
import { TYPES } from '../utils/types';

const router = express.Router();
const authController = container.get<AuthController>(TYPES.AuthController);

router.post('/login', authController.login);
router.post('/register', authController.register);

export default router;
