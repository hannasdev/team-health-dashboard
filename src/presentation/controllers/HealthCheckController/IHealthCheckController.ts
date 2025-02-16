import { Request, Response, NextFunction } from 'express';

export interface IHealthCheckController {
  getHealth(req: Request, res: Response, next: NextFunction): void;
}
