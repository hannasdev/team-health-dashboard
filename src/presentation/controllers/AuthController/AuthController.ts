// src/controllers/AuthController.ts

import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { InvalidInputError, AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IAuthController,
  IAuthenticationService,
  IAuthRequest,
  ILogger,
  IApiResponse,
  IUserService,
  IUser,
  SanitizedUser,
  IEnhancedResponse,
} from '../../../interfaces/index.js';

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TYPES.AuthenticationService)
    private authenticationService: IAuthenticationService,
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.ApiResponse) private apiResponse: IApiResponse,
  ) {}

  public async login(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password, shortLived = false } = req.body;
      if (!email || !password) {
        throw new InvalidInputError('Email and password are required');
      }

      const result = await this.authenticationService.login(
        email,
        password,
        shortLived,
      );
      const response = this.apiResponse.createSuccessResponse({
        ...result,
        user: this.sanitizeUser(result.user),
      });

      res.json(response);
    } catch (error) {
      if (error instanceof InvalidInputError) {
        next(new AppError(401, 'No token provided', 'ERR_UNAUTHORIZED'));
      } else {
        next(error);
      }
    }
  }

  public async register(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      this.logger.debug('Register request received', { email: req.body.email });
      const { email, password } = req.body;
      if (!email || !password) {
        throw new InvalidInputError('Email and password are required');
      }
      const user = await this.userService.registerUser(email, password);
      const { accessToken, refreshToken } =
        await this.authenticationService.login(email, password);

      this.logger.debug('Register successful', { email });

      const response = this.apiResponse.createSuccessResponse({
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      });

      res.status(201).json(response);
    } catch (error) {
      this.logger.error(
        'Register failed',
        error instanceof Error ? error : new Error('Unknown error'),
      );
      next(error);
    }
  }

  public async refreshToken(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        this.logger.error('Refresh token is required');
        throw new InvalidInputError('Refresh token is required');
      }

      this.logger.debug('Attempting to refresh token', {
        refreshToken: refreshToken.substring(0, 10) + '...',
      });

      const result =
        await this.authenticationService.refreshToken(refreshToken);

      this.logger.debug('Token refresh successful');

      res.json(this.apiResponse.createSuccessResponse(result));
    } catch (error) {
      this.logger.error('Token refresh failed', error as Error);
      next(error);
    }
  }

  public async logout(
    req: IAuthRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new InvalidInputError('Refresh token is required');
      }
      await this.authenticationService.logout(refreshToken);
      res.status(204).send('Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  private sanitizeUser(user: IUser): SanitizedUser {
    const { password, ...sanitizedData } = user.toObject();
    return {
      ...sanitizedData,
      toObject: () => sanitizedData,
    };
  }
}
