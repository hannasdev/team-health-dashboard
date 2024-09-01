// src/services/auth/AuthenticationService.ts
import { injectable, inject } from 'inversify';

import { User } from '../../models/User.js';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthenticationService,
  IUserRepository,
  ITokenService,
  ITokenBlacklistService,
  IBcryptService,
  ILogger,
} from '../../interfaces/index.js';

@injectable()
export class AuthenticationService implements IAuthenticationService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.TokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.bcryptService.compare(password, user.password))) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new InvalidCredentialsError();
    }
    this.logger.info(`Successful login for user: ${email}`);
    const accessToken = this.tokenService.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      id: user.id,
    });
    return { user, accessToken, refreshToken };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (await this.tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
        throw new InvalidRefreshTokenError('Refresh token has been revoked');
      }

      const decoded = this.tokenService.validateRefreshToken(refreshToken);
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new InvalidRefreshTokenError('User not found');
      }

      await this.tokenBlacklistService.blacklistToken(
        refreshToken,
        decoded.exp * 1000,
      );

      const newAccessToken = this.tokenService.generateAccessToken({
        id: user.id,
        email: user.email,
      });
      const newRefreshToken = this.tokenService.generateRefreshToken({
        id: user.id,
      });

      this.logger.info(`Token refreshed for user: ${user.email}`);
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      this.logger.error(
        'Error refreshing token:',
        error instanceof Error ? error : new Error('Unknown error'),
      );
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const decodedToken = this.tokenService.decodeToken(refreshToken);
      await this.tokenBlacklistService.blacklistToken(
        refreshToken,
        decodedToken.exp * 1000,
      );
      this.logger.info(`User logged out: ${decodedToken.id}`);
    } catch (error) {
      this.logger.error(
        'Error during logout:',
        error instanceof Error ? error : new Error('Unknown error'),
      );
      throw new Error('Failed to logout');
    }
  }
}
