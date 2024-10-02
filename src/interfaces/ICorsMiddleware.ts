import { Request, Response, NextFunction } from 'express';

export interface ICorsMiddleware {
  handle(req: Request, res: Response, next: NextFunction): void;
}
