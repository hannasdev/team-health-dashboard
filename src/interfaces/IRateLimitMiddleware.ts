import type { IEnhancedRequest } from './IEnhancedRequest';
import type { IMiddleware } from './IMiddleware';

export interface IRateLimitMiddleware extends IMiddleware {
  getKey(req: IEnhancedRequest): string;
  getRemainingRequests(key: string): Promise<number>;
}
