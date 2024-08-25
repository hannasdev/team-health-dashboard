// src/middleware/AuthMiddleware.ts
import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import {
  IAuthRequest,
  IAuthMiddleware,
  ITokenService,
  ITokenBlacklistService,
  ILogger,
} from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

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
      return res.status(401).json({ message: 'No token provided' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      this.logger.warn('Invalid authorization header format');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const isRevoked =
        await this.tokenBlacklistService.isTokenBlacklisted(token);
      if (isRevoked) {
        this.logger.warn(
          `Attempt to use revoked token: ${token.substring(0, 10)}...`,
        );
        return res.status(401).json({ message: 'Token has been revoked' });
      }

      const decoded = this.tokenService.validateAccessToken(token);

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
        return res.status(401).json({ message: 'Token has expired' });
      }
      res.status(401).json({ message: 'Invalid token' });
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
