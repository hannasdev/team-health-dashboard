// src/interfaces/middleware/IMiddleware.ts
import type { NextFunction } from 'express';
import type { IEnhancedRequest, IEnhancedResponse } from './index.js';

export interface IMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> | void;
}
