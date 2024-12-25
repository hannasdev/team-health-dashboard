// src/presentation/middleware/AuthMiddleware.ts
import { NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { HeaderKeys, HeaderValues } from '../../../types/index.js';
import { UnauthorizedError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  IMiddleware,
  ITokenService,
  ITokenBlacklistService,
  ILogger,
  IAuthenticationService,
  IEnhancedRequest,
  IEnhancedResponse,
  IAuthenticatedRequest,
} from '../../../interfaces';

@injectable()
export class AuthMiddleware implements IMiddleware {
  constructor(
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.TokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.AuthenticationService)
    private authService: IAuthenticationService,
  ) {}

  public handle = async (
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.extractTokenFromHeader(req);
      await this.validateToken(token);

      const authenticatedReq = req as IAuthenticatedRequest;
      authenticatedReq.user = this.tokenService.validateAccessToken(token);

      if (this.isTokenAboutToExpire(authenticatedReq.user)) {
        await this.handleTokenRefresh(authenticatedReq, res);
      } else {
        res.setHeader(HeaderKeys.X_TOKEN_EXPIRING, 'true');
      }

      next();
    } catch (error) {
      this.handleAuthError(error, next);
    }
  };

  private extractTokenFromHeader(req: IEnhancedRequest): string {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedError('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer.toLowerCase() !== HeaderValues.BEARER.toLowerCase() || !token) {
      throw new UnauthorizedError('Invalid token format');
    }

    return token;
  }

  private async validateToken(token: string): Promise<void> {
    const isRevoked =
      await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isRevoked) {
      throw new UnauthorizedError('Token has been revoked');
    }
  }

  private isTokenAboutToExpire(decoded: any): boolean {
    const expirationThreshold = 5 * 60; // 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime < expirationThreshold;
  }

  private async handleTokenRefresh(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
  ) {
    try {
      const newTokens = await this.authService.refreshToken(req.user.id);
      this.updateRequestAndResponse(req, res, newTokens);
      const decoded = this.tokenService.validateAccessToken(
        newTokens.accessToken,
      );
      this.logger.info(`User authenticated: ${decoded.email}`);
      return decoded;
    } catch (refreshError) {
      this.logger.error('Failed to refresh token', refreshError as Error);
      throw new UnauthorizedError('Failed to refresh token');
    }
  }

  private updateRequestAndResponse(
    req: IAuthenticatedRequest,
    res: IEnhancedResponse,
    newTokens: { accessToken: string; refreshToken: string },
  ): void {
    req.headers.authorization = `${HeaderValues.BEARER} ${newTokens.accessToken}`;
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.setHeader(HeaderKeys.X_TOKEN_REFRESHED, 'true');
  }

  private handleAuthError(error: unknown, next: NextFunction): void {
    if (error instanceof UnauthorizedError) {
      this.logger.warn(`Authentication error: ${error.message}`);
    } else {
      this.logger.error('Authentication error:', error as Error);
    }
    next(error);
  }
}
