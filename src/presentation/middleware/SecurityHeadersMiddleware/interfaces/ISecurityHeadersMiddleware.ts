import { NextFunction, Application } from 'express';

import { IEnhancedResponse, IMiddleware } from '../../interfaces/index.js';
import { ISecurityRequest } from '../../RateLimitMiddleware/interfaces/index.js';

export interface ISecurityHeadersMiddleware extends IMiddleware {
  handle(
    req: ISecurityRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
  configureCspReporting(app: Application): void;
}
