// src/interfaces/IAuthController.ts
import { Response } from 'express';

import { IAuthRequest } from './IAuthRequest';

interface IAuthController {
  login(req: IAuthRequest, res: Response): Promise<void>;
  register(req: IAuthRequest, res: Response): Promise<void>;
}

export { IAuthController };
