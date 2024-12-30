// src/interfaces/IAuthRequest.ts
import type { IEnhancedRequest } from './IEnhancedRequest';
export interface IAuthRequest extends IEnhancedRequest {
  body: {
    email?: string;
    password?: string;
    refreshToken?: string;
    shortLived?: boolean;
  };
}
