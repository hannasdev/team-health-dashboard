// src/middleware/AuthMiddleware.ts
import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { UnauthorizedError } from '../utils/errors.js';
import { TYPES } from '../utils/types.js';

import type {
  IAuthRequest,
  IAuthMiddleware,
  ITokenService,
  ITokenBlacklistService,
  ILogger,
} from '../interfaces';

@injectable()
export class AuthMiddleware implements IAuthMiddleware {
  constructor(
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.TokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public handle = async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void | Response> => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this.logger.warn('Authorization header missing');
      return next(new UnauthorizedError('No token provided'));
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      this.logger.warn('Invalid authorization header format');
      return next(new UnauthorizedError('Invalid token format'));
    }

    try {
      const isRevoked =
        await this.tokenBlacklistService.isTokenBlacklisted(token);
      if (isRevoked) {
        this.logger.warn(
          `Attempt to use revoked token: ${token.substring(0, 10)}...`,
        );
        return next(new UnauthorizedError('Token has been revoked'));
      }

      const decoded = this.tokenService.validateAccessToken(token);

      if (req.headers.accept === 'text/event-stream') {
        // For SSE requests, allow the connection even if the token is about to expire
        req.user = decoded;
        next();
        return;
      }

      // Check if the token is about to expire
      const expirationThreshold = 5 * 60; // 5 minutes
      if (this.isTokenAboutToExpire(decoded, expirationThreshold)) {
        // Set a custom header to indicate that the token is about to expire
        res.setHeader('X-Token-Expiring', 'true');
      }

      req.user = decoded;
      this.logger.info(`User authenticated: ${decoded.email}`);
      next();
    } catch (error) {
      this.logger.error(
        `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Token has expired'));
      }
      return next(new UnauthorizedError('Invalid token'));
    }
  };

  private isTokenAboutToExpire(
    decoded: any,
    thresholdSeconds: number,
  ): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime < thresholdSeconds;
  }
}
