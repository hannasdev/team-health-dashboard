import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';
import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';

import type {
  ILogger,
  ICacheService,
  IRateLimitConfig,
  IRateLimitMiddleware,
  ISecurityLogger,
  ISecurityRequest,
} from '../../../interfaces/index.js';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

@injectable()
export class RateLimitMiddleware implements IRateLimitMiddleware {
  private config: Required<IRateLimitConfig>;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) private cacheService: ICacheService,
    @inject(TYPES.SecurityLogger) private securityLogger: ISecurityLogger,
    @inject(TYPES.RateLimitConfig) config: IRateLimitConfig,
  ) {
    this.config = {
      windowMs: config?.windowMs ?? 15 * 60 * 1000,
      maxRequests: config?.maxRequests ?? 100,
      message: config?.message ?? 'Too many requests, please try again later',
    };
  }

  public async handle(
    req: Request<ParamsDictionary, any, any, Query>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const securityReq: ISecurityRequest = {
        method: req.method,
        path: req.path || req.url,
        ip: req.ip || req.socket?.remoteAddress || 'unknown',
        get: (name: string) => req.get?.(name),
        user: (req as any).user,
      };

      const key = this.getKey(req);
      const requests = await this.incrementRequests(key);

      this.logger.debug('Rate limit check', {
        ip: securityReq.ip,
        path: securityReq.path,
        currentRequests: requests,
        limit: this.config.maxRequests,
      });

      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, this.config.maxRequests - requests),
      );
      res.setHeader('X-RateLimit-Reset', await this.getResetTime(key));

      if (requests > this.config.maxRequests) {
        this.logger.warn(`Rate limit exceeded for IP: ${securityReq.ip}`, {
          requests,
          limit: this.config.maxRequests,
          path: securityReq.path,
        });

        this.securityLogger.logSecurityEvent(
          this.securityLogger.createSecurityEvent(
            SecurityEventType.RATE_LIMIT_EXCEEDED,
            securityReq,
            {
              requests,
              limit: this.config.maxRequests,
              windowMs: this.config.windowMs,
            },
            SecurityEventSeverity.MEDIUM,
          ),
        );

        throw new AppError(429, this.config.message);
      }

      this.logger.debug('Rate limit check passed', {
        ip: securityReq.ip,
        path: securityReq.path,
        remainingRequests: this.config.maxRequests - requests,
      });

      next();
    } catch (error) {
      this.logger.error('Error in rate limit middleware:', error as Error, {
        ip: req.ip,
        path: req.path,
      });

      next(
        error instanceof AppError
          ? error
          : new AppError(500, 'Internal server error during rate limiting'),
      );
    }
  }

  public getKey(req: Request): string {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return `rate_limit:${ip}`;
  }

  public async getRemainingRequests(key: string): Promise<number> {
    const requests = (await this.cacheService.get<number>(key)) || 0;
    return Math.max(0, this.config.maxRequests - requests);
  }

  private async incrementRequests(key: string): Promise<number> {
    const current = (await this.cacheService.get<number>(key)) || 0;
    const incremented = current + 1;

    this.logger.debug('Incrementing rate limit counter', {
      key,
      previousCount: current,
      newCount: incremented,
    });

    await this.cacheService.set(key, incremented, this.config.windowMs / 1000);
    return incremented;
  }

  private async getResetTime(key: string): Promise<number> {
    const ttl = await this.cacheService.get<number>(`${key}:ttl`);
    if (!ttl) {
      const resetTime = Date.now() + this.config.windowMs;

      this.logger.debug('Setting new rate limit reset time', {
        key,
        resetTime: new Date(resetTime).toISOString(),
      });

      await this.cacheService.set(
        `${key}:ttl`,
        resetTime,
        this.config.windowMs / 1000,
      );
      return resetTime;
    }
    return ttl;
  }
}
