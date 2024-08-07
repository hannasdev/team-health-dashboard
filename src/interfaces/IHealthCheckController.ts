import { Request, Response } from 'express';

export interface IHealthCheckController {
  getHealth(req: Request, res: Response): void;
}
