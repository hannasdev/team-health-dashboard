import { NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { TYPES } from '../../../utils/types.js';
import { AppError } from '../../../utils/errors.js';

import type {
  ILogger,
  ICacheService,
  IRateLimitConfig,
  ISecurityLogger,
  IMiddleware,
  IEnhancedRequest,
  ISecurityResponse,
  ISecurityRequest,
} from '../../../interfaces/index.js';

import {
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../services/SecurityLogger/SecurityLogger.js';

interface RateLimitState {
  key: string;
  requests: number;
  remaining: number;
  reset: number;
}

@injectable()
export class RateLimitMiddleware implements IMiddleware {
  private config: Required<IRateLimitConfig>;

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) private cacheService: ICacheService,
    @inject(TYPES.SecurityLogger) private securityLogger: ISecurityLogger,
    @inject(TYPES.RateLimitConfig) config: IRateLimitConfig,
  ) {
    if (config.windowMs <= 0 || config.maxRequests <= 0) {
      throw new Error('Invalid rate limit configuration');
    }

    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config?.message ?? 'Too many requests, please try again later',
    };
  }

  public async handle(
    req: ISecurityRequest,
    res: ISecurityResponse,
    next: NextFunction,
  ): Promise<void> {
    try {
      const state = await this.getRateLimitState(req);

      this.setRateLimitHeaders(res, state);

      if (state.requests > this.config.maxRequests) {
        await this.handleRateLimitExceeded(req, state.requests);
        throw new AppError(429, this.config.message);
      }

      this.logger.debug('Rate limit check passed', {
        ip: req.ip,
        path: req.path,
        remainingRequests: state.remaining,
      });

      next();
    } catch (error) {
      this.handleError(error, req, next);
    }
  }

  public getKey(req: IEnhancedRequest): string {
    const ip = req.ip || 'unknown';
    return this.getCacheKeys(ip).requestKey;
  }

  public async getRemainingRequests(key: string): Promise<number> {
    const requests = (await this.cacheService.get<number>(key)) || 0;
    return Math.max(0, this.config.maxRequests - requests);
  }

  private getCacheKeys(ip: string) {
    const baseKey = `rate_limit:${ip}`;
    return {
      requestKey: baseKey,
      ttlKey: `${baseKey}:ttl`,
    };
  }

  private async getResetTime(key: string): Promise<number> {
    const { ttlKey } = this.getCacheKeys(key.split(':')[1]);
    const ttl = await this.cacheService.get<number>(`${ttlKey}:ttl`);

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

  private async getRateLimitState(
    req: IEnhancedRequest,
  ): Promise<RateLimitState> {
    const key = this.getKey(req);
    const requests = await this.incrementRequests(key);
    const reset = await this.getResetTime(key);
    const remaining = Math.max(0, this.config.maxRequests - requests);

    return { key, requests, remaining, reset };
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

  private setRateLimitHeaders(
    res: ISecurityResponse,
    state: RateLimitState,
  ): void {
    res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', state.remaining);
    res.setHeader('X-RateLimit-Reset', state.reset);
  }

  private async handleRateLimitExceeded(
    req: ISecurityRequest,
    requests: number,
  ): Promise<void> {
    try {
      this.logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        requests,
        limit: this.config.maxRequests,
        path: req.path,
      });

      await this.securityLogger.logSecurityEvent(
        this.securityLogger.createSecurityEvent(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          req,
          {
            requests,
            limit: this.config.maxRequests,
            windowMs: this.config.windowMs,
          },
          SecurityEventSeverity.MEDIUM,
        ),
      );
    } catch (error) {
      this.logger.error(
        'Failed to log rate limit security event:',
        error as Error,
      );
    }
  }

  private handleError(
    error: unknown,
    req: IEnhancedRequest,
    next: NextFunction,
  ): void {
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
