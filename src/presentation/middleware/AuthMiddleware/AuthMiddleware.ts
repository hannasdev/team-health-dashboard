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
      this.logger.warn('Authorization header missing', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      throw new UnauthorizedError('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer.toLowerCase() !== HeaderValues.BEARER.toLowerCase() || !token) {
      this.logger.warn('Invalid authorization header format', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        bearer,
      });
      throw new UnauthorizedError('Invalid token format');
    }

    return token;
  }

  private async validateToken(token: string): Promise<void> {
    const isRevoked =
      await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isRevoked) {
      this.logger.warn('Attempt to use revoked token', {
        token: token.substring(0, 10) + '...',
      });
      throw new UnauthorizedError('Token has been revoked');
    }
  }

  private isTokenAboutToExpire(decoded: any): boolean {
    const expirationThreshold = 5 * 60; // 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - currentTime;

    this.logger.debug('Checking token expiration', {
      timeUntilExpiry,
      threshold: expirationThreshold,
    });

    return timeUntilExpiry < expirationThreshold;
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
      this.logger.info('Token refreshed successfully', {
        userId: decoded.id,
        email: decoded.email,
      });

      return decoded;
    } catch (refreshError) {
      this.logger.error(
        'Token refresh failed',
        refreshError instanceof Error
          ? refreshError
          : new Error('Unknown error'),
        {
          userId: req.user?.id,
        },
      );
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

    this.logger.debug('Updated request and response with new tokens', {
      userId: req.user?.id,
      tokenRefreshed: true,
    });
  }

  private handleAuthError(error: unknown, next: NextFunction): void {
    if (error instanceof UnauthorizedError) {
      this.logger.warn('Authentication error', {
        error: error.message,
        type: error.constructor.name,
        statusCode: error.statusCode,
      });
    } else {
      this.logger.error(
        'Authentication error',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      );
    }
    next(error);
  }
}
