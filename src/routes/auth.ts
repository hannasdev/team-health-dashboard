// src/routes/auth.ts
import { Router } from 'express';

import { AuthController } from '../controllers/AuthController/AuthController.js';

export default function (authController: AuthController) {
  const router = Router();
  router.post('/register', (req, res, next) =>
    authController.register(req, res, next),
  );
  router.post('/login', (req, res, next) =>
    authController.login(req, res, next),
  );
  router.post('/logout', (req, res, next) =>
    authController.logout(req, res, next),
  );
  router.post('/refresh', (req, res, next) =>
    authController.refreshToken(req, res, next),
  );
  return router;
}
