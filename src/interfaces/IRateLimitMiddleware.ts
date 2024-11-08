import { Request, Response, NextFunction } from 'express';

export interface IRateLimitMiddleware {
  handle(req: Request, res: Response, next: NextFunction): Promise<void>;
  getKey(req: Request): string;
  getRemainingRequests(key: string): Promise<number>;
}
