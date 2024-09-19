// src/interfaces/IAuthRequest.ts

import { Request } from 'express';

export interface IAuthRequest extends Request {
  user?: { id: string; email: string };
  body: {
    email?: string;
    password?: string;
    refreshToken?: string;
    shortLived?: boolean;
  };
}
