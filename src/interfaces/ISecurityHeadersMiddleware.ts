import { NextFunction, Application } from 'express';
import { IMiddleware } from './IMiddleware';
import { ISecurityRequest } from './ISecurityRequest';
import { IEnhancedResponse } from './IEnhancedResponse';

export interface ISecurityHeadersMiddleware extends IMiddleware {
  handle(
    req: ISecurityRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
  configureCspReporting(app: Application): void;
}
