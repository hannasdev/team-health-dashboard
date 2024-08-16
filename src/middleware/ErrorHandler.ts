// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../utils/types.js';

import type { ILogger } from '../interfaces/index.js';

@injectable()
export class ErrorHandler {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  public handle = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    this.logger.error('Error caught in error handler:', err);

    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';

    if (err.name === 'TimeoutError') {
      statusCode = 504;
      errorMessage = 'Operation timed out';
    } else if (err.name === 'SimulatedError') {
      statusCode = 400;
      errorMessage = 'Simulated error';
    }

    if (req.headers['content-type'] === 'text/event-stream') {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          success: false,
          errors: [{ message: errorMessage }],
          status: statusCode,
        })}\n\n`,
      );
      res.end();
    } else {
      res.status(statusCode).json({
        success: false,
        errors: [{ message: errorMessage }],
      });
    }
  };
}
