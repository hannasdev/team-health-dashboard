// src/interfaces/middleware/IRateLimitedRequest.ts
import type { IEnhancedRequest } from './IEnhancedRequest.js';

interface IRateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface IRateLimitedRequest extends IEnhancedRequest {
  rateLimit: IRateLimitInfo;
}
