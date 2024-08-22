// src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';

import { container } from '../container.js';
import { AuthController } from '../controllers/AuthController.js';
import { TYPES } from '../utils/types.js';

const router = Router();
const getAuthController = () =>
  container.get<AuthController>(TYPES.AuthController);

router.post('/login', (req: Request, res: Response, next: NextFunction) =>
  getAuthController().login(req, res, next),
);

router.post('/register', (req: Request, res: Response, next: NextFunction) =>
  getAuthController().register(req, res, next),
);

router.post('/refresh', (req: Request, res: Response, next: NextFunction) =>
  getAuthController().refreshToken(req, res, next),
);

export default router;
