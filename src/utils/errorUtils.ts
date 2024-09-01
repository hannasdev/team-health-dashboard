// src/utils/errorUtils.ts

// Utilized by the Logger class to serialize errors for logging purposes.

import { AppError } from './errors';

export function serializeError(err: Error): object {
  if (err instanceof AppError) {
    return {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      details: err.details,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    };
  }
  return {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  };
}
