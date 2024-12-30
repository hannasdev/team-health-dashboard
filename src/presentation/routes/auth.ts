// src/routes/auth.ts
import { Router, NextFunction } from 'express';

import { container } from '../../container.js';
import { TYPES } from '../../utils/types.js';
import { AuthController } from '../controllers/AuthController/AuthController.js';

import type {
  IAuthRequest,
  IEnhancedResponse,
} from '../../interfaces/index.js';

const router = Router();
const getAuthController = () =>
  container.get<AuthController>(TYPES.AuthController);

router.post('/login', (req, res: IEnhancedResponse, next?: NextFunction) => {
  if (!next) {
    throw new Error('Next function is required');
  }
  getAuthController().login(req as unknown as IAuthRequest, res, next);
});

router.post('/logout', (req, res: IEnhancedResponse, next?: NextFunction) => {
  if (!next) {
    throw new Error('Next function is required');
  }
  getAuthController().logout(req as unknown as IAuthRequest, res, next);
});

router.post('/register', (req, res: IEnhancedResponse, next?: NextFunction) => {
  if (!next) {
    throw new Error('Next function is required');
  }
  getAuthController().register(req as unknown as IAuthRequest, res, next);
});

router.post('/refresh', (req, res: IEnhancedResponse, next?: NextFunction) => {
  if (!next) {
    throw new Error('Next function is required');
  }
  getAuthController().refreshToken(req as unknown as IAuthRequest, res, next);
});

export default router;
