// src/controllers/AuthController.ts

import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../utils/types.js';
import type {
  IAuthController,
  IAuthService,
  IAuthRequest,
} from '../interfaces';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../utils/ApiResponse';
import { UnauthorizedError } from '../utils/errors.js';
import { User } from 'models/User.js';

@injectable()
export class AuthController implements IAuthController {
  constructor(@inject(TYPES.AuthService) private authService: IAuthService) {}

  public async login(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new UnauthorizedError('Email and password are required');
      }
      const result = await this.authService.login(email, password);
      res.json(
        createSuccessResponse({
          ...result,
          user: this.sanitizeUser(result.user),
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  public async register(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new UnauthorizedError('Email and password are required');
      }
      const result = await this.authService.register(email, password);
      res.status(201).json(
        createSuccessResponse({
          ...result,
          user: this.sanitizeUser(result.user),
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  public async refreshToken(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }
      const result = await this.authService.refreshToken(refreshToken);
      res.json(createSuccessResponse(result));
    } catch (error) {
      next(error);
    }
  }

  public async logout(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }
      await this.authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}
