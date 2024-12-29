// src/interfaces/IAuthMiddleware.ts
import { NextFunction } from 'express';

import { IEnhancedRequest } from './IEnhancedRequest.js';
import { IEnhancedResponse } from './IEnhancedResponse.js';

export interface IAuthMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
}
