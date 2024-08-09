import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import type { ILogger, IHealthCheckController } from '@/interfaces';
import { TYPES } from '@/utils/types';

@injectable()
export class HealthCheckController implements IHealthCheckController {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  public getHealth(req: Request, res: Response): void {
    try {
      // Here you could add checks for database connectivity, external services, etc.
      const status = 'OK';
      this.logger.info('Health check performed', { status });
      res.status(200).json({ status });
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      res.status(500).json({ status: 'ERROR', message: 'Health check failed' });
    }
  }
}
