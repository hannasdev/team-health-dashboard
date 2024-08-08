// src/interfaces/IAuthMiddleware.ts
import { Response, NextFunction } from 'express';

import { IAuthRequest } from '@/interfaces';

export interface IAuthMiddleware {
  handle(req: IAuthRequest, res: Response, next: NextFunction): void | Response;
}
