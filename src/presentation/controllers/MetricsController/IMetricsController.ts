import { NextFunction } from 'express';

import type { IAuthenticatedRequest } from '../../middleware/AuthMiddleware/IAuthenticatedRequest';
import type { IEnhancedResponse } from '../../middleware/interfaces/index.js';

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
