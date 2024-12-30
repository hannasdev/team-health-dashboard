// src/middleware/ErrorHandler.ts
import { NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  ILogger,
  IApiResponse,
  IEnhancedRequest,
  IEnhancedResponse,
} from '../../../interfaces/index.js';

@injectable()
export class ErrorHandler {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public handle = (
    err: Error,
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ) => {
    this.logger.error('Error caught in error handler:', err);

    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'ERR_INTERNAL_SERVER_ERROR';

    if (err instanceof AppError) {
      statusCode = err.statusCode;
      errorMessage = err.message;
      errorCode = err.errorCode || errorCode;
    }

    res
      .status(statusCode)
      .json(
        this.apiResponse.createErrorResponse(
          errorMessage,
          { errorCode },
          statusCode,
        ),
      );
  };
}
