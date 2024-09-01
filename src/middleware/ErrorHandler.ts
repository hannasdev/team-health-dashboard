// src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { AppError, UnauthorizedError } from '../utils/errors.js';
import { TYPES } from '../utils/types.js';

import type { ILogger, IApiResponse } from '../interfaces/index.js';

@injectable()
export class ErrorHandler {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public handle = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    this.logger.error('Error caught in error handler:', err);

    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    let errorDetails = {};

    if (err instanceof AppError) {
      statusCode = err.statusCode;
      errorMessage = err.message;
      errorDetails = {
        errorCode: err.errorCode,
        details: err.details,
      };
    }

    res
      .status(statusCode)
      .json(
        this.apiResponse.createErrorResponse(
          errorMessage,
          errorDetails,
          statusCode,
        ),
      );
  };
}
