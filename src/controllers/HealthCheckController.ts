import { Request, Response } from 'express';
import { injectable } from 'inversify';

@injectable()
export class HealthCheckController {
  public getHealth(req: Request, res: Response): void {
    res.status(200).json({ status: 'OK' });
  }
}
