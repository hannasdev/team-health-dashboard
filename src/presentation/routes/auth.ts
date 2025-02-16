// src/routes/auth.ts
import { Router, NextFunction } from 'express';

import { container } from '../../container.js';
import { TYPES } from '../../utils/types.js';
import { AuthController } from '../controllers/AuthController/AuthController.js';

import type { IAuthRequest } from '../../presentation/controllers/AuthController/index.js';
import type { IEnhancedResponse } from '../middleware/interfaces/index.js';

const router = Router();
const getAuthController = () =>
  container.get<AuthController>(TYPES.AuthController);

router.post(
  '/login',
  async (req, res: IEnhancedResponse, next?: NextFunction) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    await getAuthController().login(req as unknown as IAuthRequest, res, next);
  },
);

router.post(
  '/logout',
  async (req, res: IEnhancedResponse, next?: NextFunction) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    await getAuthController().logout(req as unknown as IAuthRequest, res, next);
  },
);

router.post(
  '/register',
  async (req, res: IEnhancedResponse, next?: NextFunction) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    await getAuthController().register(
      req as unknown as IAuthRequest,
      res,
      next,
    );
  },
);

router.post(
  '/refresh',
  async (req, res: IEnhancedResponse, next?: NextFunction) => {
    if (!next) {
      throw new Error('Next function is required');
    }
    await getAuthController().refreshToken(
      req as unknown as IAuthRequest,
      res,
      next,
    );
  },
);

export default router;
