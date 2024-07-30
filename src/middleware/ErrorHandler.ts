// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { Logger } from '../utils/logger';
import { TYPES } from '../utils/types';

@injectable()
export class ErrorHandler {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  handle(err: Error, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('An error occurred', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
