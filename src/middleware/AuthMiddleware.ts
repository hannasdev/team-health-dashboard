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
  IAuthenticationService,
  ISSEService,
} from '../interfaces';

@injectable()
export class AuthMiddleware implements IAuthMiddleware {
  constructor(
    @inject(TYPES.TokenService) private tokenService: ITokenService,
    @inject(TYPES.TokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.AuthenticationService)
    private authService: IAuthenticationService,
    @inject(TYPES.SSEService) private sseService: ISSEService,
  ) {}

  public handle = async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = this.extractTokenFromHeader(req);
      const refreshToken = this.extractRefreshTokenFromCookie(req);

      await this.validateToken(token);

      let decoded = this.tokenService.validateAccessToken(token);

      if (this.isTokenAboutToExpire(decoded)) {
        decoded = await this.handleTokenRefresh(token, refreshToken, req, res);
      }

      req.user = decoded;

      // Check if it's an SSE request
      if (req.headers.accept === 'text/event-stream') {
        this.handleSSEAuth(req, res, next, decoded);
      } else {
        this.logger.info(`User authenticated: ${decoded.email}`);
        next();
      }
    } catch (error) {
      this.handleAuthError(error, next, res);
    }
  };

  private handleSSEAuth(
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
    decoded: any,
  ): void {
    if (this.isTokenExpired(decoded)) {
      this.logger.warn(`Expired token for SSE connection: ${decoded.email}`);
      this.sseService.handleError(new UnauthorizedError('Token has expired'));
      return;
    }

    this.logger.info(`SSE connection authenticated for user: ${decoded.email}`);

    // Initialize SSE connection
    this.sseService.initialize(res);

    // Set up token expiration check for SSE
    const checkTokenInterval = setInterval(() => {
      if (this.isTokenExpired(decoded)) {
        this.logger.warn(`Token expired for SSE connection: ${decoded.email}`);
        this.sseService.sendEvent('error', { message: 'Token expired' });
        this.sseService.endResponse();
        clearInterval(checkTokenInterval);
      }
    }, 60000); // Check every minute

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(checkTokenInterval);
      this.sseService.handleClientDisconnection();
    });

    next();
  }

  private isTokenExpired(decoded: any): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp <= currentTime;
  }

  private extractTokenFromHeader(req: IAuthRequest): string {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      this.logger.warn('Authorization header missing or invalid');
      throw new UnauthorizedError('No token provided');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      this.logger.warn('Invalid authorization header format');
      throw new UnauthorizedError('Invalid token format');
    }

    return token;
  }

  private extractRefreshTokenFromCookie(req: IAuthRequest): string | undefined {
    return req.cookies?.refreshToken;
  }

  private async validateToken(token: string): Promise<void> {
    const isRevoked =
      await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isRevoked) {
      this.logger.warn(
        `Attempt to use revoked token: ${token.substring(0, 10)}...`,
      );
      throw new UnauthorizedError('Token has been revoked');
    }
  }

  private isTokenAboutToExpire(decoded: any): boolean {
    const expirationThreshold = 5 * 60; // 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp - currentTime < expirationThreshold;
  }

  private async handleTokenRefresh(
    token: string,
    refreshToken: string | undefined,
    req: IAuthRequest,
    res: Response,
  ): Promise<any> {
    if (refreshToken) {
      try {
        const newTokens = await this.authService.refreshToken(refreshToken);
        this.updateRequestAndResponse(req, res, newTokens);
        return this.tokenService.validateAccessToken(newTokens.accessToken);
      } catch (refreshError) {
        this.logger.error('Failed to refresh token', refreshError as Error);
        res.setHeader('X-Token-Expiring', 'true');
        // Continue with the existing token
      }
    } else {
      res.setHeader('X-Token-Expiring', 'true');
    }
    return this.tokenService.validateAccessToken(token);
  }

  private updateRequestAndResponse(
    req: IAuthRequest,
    res: Response,
    newTokens: { accessToken: string; refreshToken: string },
  ): void {
    req.headers.authorization = `Bearer ${newTokens.accessToken}`;
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    res.setHeader('X-Token-Refreshed', 'true');
  }

  private handleAuthError(
    error: unknown,
    next: NextFunction,
    res: Response,
  ): void {
    this.logger.error(
      `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    const unauthorizedError = new UnauthorizedError(
      error instanceof Error ? error.message : 'Invalid token',
    );
    if (res.headersSent) {
      this.sseService.handleError(unauthorizedError);
    } else {
      next(unauthorizedError);
    }
  }
}
