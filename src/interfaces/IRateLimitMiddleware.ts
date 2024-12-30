import { IMiddleware } from './IMiddleware';
import { IEnhancedRequest } from './IEnhancedRequest';

export interface IRateLimitMiddleware extends IMiddleware {
  getKey(req: IEnhancedRequest): string;
  getRemainingRequests(key: string): Promise<number>;
}
