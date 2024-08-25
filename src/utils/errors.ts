// src/utils/errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(401, message);
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(message = 'User already exists') {
    super(409, message);
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(404, message);
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor(message = 'Invalid refresh token') {
    super(401, message);
  }
}

export class InvalidResetTokenError extends AppError {
  constructor(message = 'Invalid reset token') {
    super(401, message);
  }
}
