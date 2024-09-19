import { Request, Response, NextFunction } from 'express';

export interface IMetricsController {
  getAllMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
  syncMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
}
