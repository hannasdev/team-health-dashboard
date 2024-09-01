// src/controllers/AuthController.ts

import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { User } from 'models/User.js';

import { UnauthorizedError, InvalidInputError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthController,
  IAuthService,
  IAuthRequest,
  ILogger,
  IApiResponse,
} from '../../interfaces';

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: IAuthService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public async login(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new InvalidInputError('Email and password are required');
      }
      const result = await this.authService.login(email, password);
      res.json(
        this.apiResponse.createSuccessResponse({
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
      this.logger.debug('Register request received', { email: req.body.email });
      const { email, password } = req.body;
      if (!email || !password) {
        throw new InvalidInputError('Email and password are required');
      }
      const result = await this.authService.register(email, password);
      this.logger.debug('Register successful', { email });
      res.status(201).json(
        this.apiResponse.createSuccessResponse({
          ...result,
          user: this.sanitizeUser(result.user),
        }),
      );
    } catch (error) {
      this.logger.error('Register failed', error as Error);
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
        this.logger.error('Refresh token is required');
        throw new InvalidInputError('Refresh token is required');
      }
      const result = await this.authService.refreshToken(refreshToken);
      res.json(this.apiResponse.createSuccessResponse(result));
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
        throw new InvalidInputError('Refresh token is required');
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
