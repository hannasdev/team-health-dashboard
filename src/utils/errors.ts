// src/utils/errors.ts
export enum ErrorCode {
  UNAUTHORIZED = 'ERR_UNAUTHORIZED',
  FORBIDDEN = 'ERR_FORBIDDEN',
  INVALID_CREDENTIALS = 'ERR_INVALID_CREDENTIALS',
  USER_ALREADY_EXISTS = 'ERR_USER_ALREADY_EXISTS',
  USER_NOT_FOUND = 'ERR_USER_NOT_FOUND',
  INVALID_REFRESH_TOKEN = 'ERR_INVALID_REFRESH_TOKEN',
  INVALID_RESET_TOKEN = 'ERR_INVALID_RESET_TOKEN',
  INVALID_INPUT = 'ERR_INVALID_INPUT',
  INTERNAL_SERVER_ERROR = 'ERR_INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'ERR_NOT_FOUND',
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorCode?: string,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, ErrorCode.FORBIDDEN);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(401, message, ErrorCode.INVALID_CREDENTIALS);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message = 'User already exists') {
    super(409, message, ErrorCode.USER_ALREADY_EXISTS);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(404, message, ErrorCode.USER_NOT_FOUND);
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message = 'Invalid refresh token') {
    super(401, message, ErrorCode.INVALID_REFRESH_TOKEN);
  }
}

export class InvalidResetTokenError extends AppError {
  constructor(message = 'Invalid reset token') {
    super(401, message, ErrorCode.INVALID_RESET_TOKEN);
  }
}
export class InvalidInputError extends AppError {
  constructor(message = 'Invalid input', details?: any) {
    super(400, message, ErrorCode.INVALID_INPUT, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, message, ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: any) {
    super(400, message, ErrorCode.INVALID_INPUT, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, ErrorCode.NOT_FOUND);
  }
}
