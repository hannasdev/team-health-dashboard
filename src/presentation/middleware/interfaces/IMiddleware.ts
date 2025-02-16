// src/interfaces/middleware/IMiddleware.ts
import type { IEnhancedRequest, IEnhancedResponse } from './index.js';
import type { NextFunction } from 'express';

export interface IMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> | void;
}
