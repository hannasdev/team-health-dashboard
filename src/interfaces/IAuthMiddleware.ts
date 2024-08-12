// src/interfaces/IAuthMiddleware.ts
import { Response, NextFunction } from 'express';

import type { IAuthRequest } from './IAuthRequest.js';

export interface IAuthMiddleware {
  handle(req: IAuthRequest, res: Response, next: NextFunction): void;
}
