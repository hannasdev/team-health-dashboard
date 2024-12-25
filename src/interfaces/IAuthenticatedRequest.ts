// src/interfaces/middleware/IAuthenticatedRequest.ts
import type { IEnhancedRequest } from './IEnhancedRequest.js';

export interface IAuthenticatedRequest extends IEnhancedRequest {
  user: {
    id: string;
    email: string;
    exp: number;
  };
}
