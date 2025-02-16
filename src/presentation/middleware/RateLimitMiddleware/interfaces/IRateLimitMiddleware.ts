import type { IEnhancedRequest, IMiddleware } from '../../interfaces/index.js';

export interface IRateLimitMiddleware extends IMiddleware {
  getKey(req: IEnhancedRequest): string;
  getRemainingRequests(key: string): Promise<number>;
}
