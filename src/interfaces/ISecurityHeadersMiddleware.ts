import { NextFunction, Application } from 'express';

import { IEnhancedResponse } from './IEnhancedResponse';
import { IMiddleware } from './IMiddleware';
import { ISecurityRequest } from './ISecurityRequest';

export interface ISecurityHeadersMiddleware extends IMiddleware {
  handle(
    req: ISecurityRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
  configureCspReporting(app: Application): void;
}
