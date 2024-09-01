// src/controllers/AuthController.ts

import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { User } from 'models/User.js';

import { InvalidInputError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthController,
  IAuthenticationService,
  IAuthRequest,
  ILogger,
  IApiResponse,
  IUserService,
} from '../../interfaces';

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
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new InvalidInputError('Email and password are required');
      }
      const result = await this.authenticationService.login(email, password);
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
      const user = await this.userService.registerUser(email, password);
      const { accessToken, refreshToken } =
        await this.authenticationService.login(email, password);
      this.logger.debug('Register successful', { email });
      res.status(201).json(
        this.apiResponse.createSuccessResponse({
          user: this.sanitizeUser(user),
          accessToken,
          refreshToken,
        }),
      );
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
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        this.logger.error('Refresh token is required');
        throw new InvalidInputError('Refresh token is required');
      }
      const result =
        await this.authenticationService.refreshToken(refreshToken);
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
      await this.authenticationService.logout(refreshToken);
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
