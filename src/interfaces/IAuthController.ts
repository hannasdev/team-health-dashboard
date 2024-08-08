// src/interfaces/IAuthController.ts
import { Request, Response } from 'express';

export interface IAuthRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface IAuthController {
  login(req: IAuthRequest, res: Response): Promise<void>;
  register(req: IAuthRequest, res: Response): Promise<void>;
}
