// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { createErrorResponse } from '../utils/ApiResponse/index.js';
import { AppError, UnauthorizedError } from '../utils/errors.js';
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

    if (err instanceof AppError) {
      res.status(err.statusCode).json(createErrorResponse(err.message));
    } else if (err instanceof UnauthorizedError) {
      res.status(401).json(createErrorResponse(err.message));
    } else {
      res.status(500).json(createErrorResponse('An unexpected error occurred'));
    }
  };
}
