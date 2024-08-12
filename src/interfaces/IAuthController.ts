// src/interfaces/IAuthController.ts
import { Response, NextFunction } from 'express';

import { IAuthRequest } from './IAuthRequest.js';

interface IAuthController {
  login(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
  register(req: IAuthRequest, res: Response, next: NextFunction): Promise<void>;
}

export { IAuthController };
