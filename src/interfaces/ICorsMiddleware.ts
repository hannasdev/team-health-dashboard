import { NextFunction } from 'express';

import type { IEnhancedRequest } from './IEnhancedRequest';
import type { IEnhancedResponse } from './IEnhancedResponse';
import type { IMiddleware } from './IMiddleware';

export interface ICorsMiddleware extends IMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
}
