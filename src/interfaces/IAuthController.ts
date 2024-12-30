// src/interfaces/IAuthController.ts
import { NextFunction } from 'express';

import type { IAuthRequest } from './IAuthRequest.js';
import type { IEnhancedResponse } from './IEnhancedResponse.js';

export interface IAuthController {
  login(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
  register(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
  refreshToken(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
  logout(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
}
