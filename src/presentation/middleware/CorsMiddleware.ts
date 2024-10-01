import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';

import { TYPES } from '../../utils/types.js';

import type {
  ICorsMiddleware,
  IConfig,
  ILogger,
} from '../../interfaces/index.js';

@injectable()
export class CorsMiddleware implements ICorsMiddleware {
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
  }

  public handle = (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (
      origin &&
      (this.allowedOrigins.includes(origin) ||
        this.allowedOrigins.includes('*'))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      this.allowedMethods.join(', '),
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      this.allowedHeaders.join(', '),
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  };
}
