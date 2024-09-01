// src/services/AuthService.ts
import { inject, injectable } from 'inversify';

import { User } from '../../models/User.js';
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  AppError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IAuthService,
  IConfig,
  ITokenService,
  ITokenBlacklistService,
  IBcryptService,
  IUserRepository,
  ILogger,
} from '../../interfaces';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.TokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
    @inject(TYPES.BcryptService) private bcryptService: IBcryptService,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async login(
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

  public async logout(refreshToken: string): Promise<void> {
    try {
      const decodedToken = this.tokenService.decodeToken(refreshToken);
      await this.tokenBlacklistService.blacklistToken(
        refreshToken,
        decodedToken.exp * 1000,
      );
      this.logger.info(`User logged out: ${decodedToken.id}`);
    } catch (error) {
      this.logger.error('Error during logout:', error as Error);
      throw new Error('Failed to logout');
    }
  }

  public async register(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new UserAlreadyExistsError();
    }
    const hashedPassword = await this.bcryptService.hash(
      password,
      this.config.BCRYPT_ROUNDS,
    );
    const newUser = await this.userRepository.create(email, hashedPassword);
    this.logger.info(`New user registered: ${email}`);
    const accessToken = this.tokenService.generateAccessToken({
      id: newUser.id,
      email: newUser.email,
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      id: newUser.id,
    });
    return { user: newUser, accessToken, refreshToken };
  }

  public async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (await this.tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
        throw new InvalidRefreshTokenError('Refresh token has been revoked');
      }

      const decoded = this.tokenService.validateRefreshToken(refreshToken);
      this.logger.debug(`Refresh token decoded: ${JSON.stringify(decoded)}`);

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        this.logger.warn(`User not found for id: ${decoded.id}`);
        throw new UserNotFoundError(`User not found for id: ${decoded.id}`);
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
      throw error instanceof AppError ? error : new InvalidRefreshTokenError();
    }
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenBlacklistService.revokeAllUserTokens(userId);
    this.logger.info(`Revoked all tokens for user: ${userId}`);
  }

  public async initiatePasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    const resetToken = this.tokenService.generatePasswordResetToken({
      id: user.id,
    });
    // TODO: Send email with reset token
    this.logger.info(`Password reset initiated for ${email}`);
  }

  public async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const decoded = this.tokenService.validatePasswordResetToken(resetToken);
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new UserNotFoundError();
      }
      const hashedPassword = await this.bcryptService.hash(
        newPassword,
        this.config.BCRYPT_ROUNDS,
      );
      await this.userRepository.updatePassword(user.id, hashedPassword);
      this.logger.info(`Password reset completed for user: ${user.email}`);
    } catch (error) {
      this.logger.error(
        'Error resetting password:',
        error instanceof Error ? error : new Error('Unknown error'),
      );
      throw new InvalidResetTokenError();
    }
  }

  public async getShortLivedAccessToken(
    userId: string,
    userEmail: string,
    expiresIn: string = '1s',
  ): Promise<string> {
    return this.tokenService.generateAccessToken(
      { id: userId, email: userEmail },
      expiresIn,
    );
  }
}
