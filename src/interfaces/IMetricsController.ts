import { NextFunction } from 'express';

import type { IAuthenticatedRequest, IEnhancedResponse } from './index.js';

export interface IMetricsController {
  getAllMetrics(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  syncMetrics(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;

  resetDatabase(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void>;
}
