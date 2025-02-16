import { NextFunction } from 'express';

import type {
  IEnhancedRequest,
  IEnhancedResponse,
  IMiddleware,
} from '../interfaces/index.js';

export interface ICorsMiddleware extends IMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
}
