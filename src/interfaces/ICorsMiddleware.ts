import { NextFunction } from 'express';
import { IMiddleware } from './IMiddleware';
import { IEnhancedRequest } from './IEnhancedRequest';
import { IEnhancedResponse } from './IEnhancedResponse';

export interface ICorsMiddleware extends IMiddleware {
  handle(
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void;
}
