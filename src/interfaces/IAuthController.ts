// src/interfaces/IAuthController.ts

import { Response, NextFunction } from 'express';

import type { IAuthRequest } from './IAuthRequest.js';

export interface IAuthController {
  login(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  register(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  refreshToken(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  logout(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
}
