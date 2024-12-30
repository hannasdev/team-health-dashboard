import { NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../../../utils/types.js';

import type {
  IConfig,
  ILogger,
  IMiddleware,
  IEnhancedRequest,
  IEnhancedResponse,
} from '../../../interfaces/index.js';

@injectable()
export class CorsMiddleware implements IMiddleware {
  private allowedOrigins: string[];
  private allowedMethods: string[];
  private allowedHeaders: string[];

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {
    this.allowedOrigins = this.config.CORS_ORIGIN.split(',').map(origin =>
      origin.trim(),
    );
    this.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    this.allowedHeaders = ['Content-Type', 'Authorization'];

    this.logger.info('CORS middleware initialized', {
      corsOrigin: this.config.CORS_ORIGIN,
    });
  }

  public handle = (
    req: IEnhancedRequest,
    res: IEnhancedResponse,
    next: NextFunction,
  ): void => {
    try {
      const origin = req.get('origin');
      const allowedOrigin = this.getAllowedOrigin(origin);

      if (allowedOrigin) {
        this.setCorsHeaders(res, allowedOrigin);
      }

      if (req.method === 'OPTIONS') {
        res.status(204).send('');
      } else {
        next();
      }
    } catch (error) {
      this.handleError(error as Error, next);
    }
  };

  private getAllowedOrigin(origin: string | undefined): string | null {
    // If origin is undefined but wildcard is allowed, return wildcard
    if (!origin && this.allowedOrigins.includes('*')) {
      return '*';
    }

    // If origin is defined and either matches exactly or wildcard is allowed
    if (
      origin &&
      (this.allowedOrigins.includes(origin) ||
        this.allowedOrigins.includes('*'))
    ) {
      return origin;
    }

    return null;
  }

  private setCorsHeaders(res: IEnhancedResponse, origin: string): void {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      this.allowedMethods.join(', '),
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      this.allowedHeaders.join(', '),
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  private handleError(error: Error, next: NextFunction): void {
    this.logger.error('Failed to apply CORS headers:', error);
    next(error);
  }
}
