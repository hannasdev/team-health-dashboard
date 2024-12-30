// src/interfaces/middleware/IEnhancedRequest.ts
import type { Request } from 'express';

export interface IEnhancedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
  path: string;
  method: string;
  ip: string;
  get: (key: string, defaultValue?: string | undefined) => string | undefined;
}
