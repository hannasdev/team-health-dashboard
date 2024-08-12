// src/interfaces/IAuthMiddleware.ts
import { Response, NextFunction } from 'express';

import { IAuthRequest } from './IAuthRequest.js';

export interface IAuthMiddleware {
  handle(req: IAuthRequest, res: Response, next: NextFunction): void;
}
