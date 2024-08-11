// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import type { ILogger } from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

@injectable()
export class ErrorHandler {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  handle(err: Error, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('An error occurred', err as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
