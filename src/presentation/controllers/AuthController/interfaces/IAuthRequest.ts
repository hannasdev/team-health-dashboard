// src/interfaces/IAuthRequest.ts
import type { IEnhancedRequest } from '../../../middleware/interfaces/index.js';

export interface IAuthRequest extends IEnhancedRequest {
  body: {
    email?: string;
    password?: string;
    refreshToken?: string;
    shortLived?: boolean;
  };
}
