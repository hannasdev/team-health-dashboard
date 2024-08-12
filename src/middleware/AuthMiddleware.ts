// src/middleware/AuthMiddleware.ts
import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { TYPES } from '../utils/types.js';

import type {
  IAuthRequest,
  IConfig,
  IAuthMiddleware,
  IJwtService,
} from '../interfaces/index.js';

@injectable()
export class AuthMiddleware implements IAuthMiddleware {
  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.JwtService) private jwtService: IJwtService,
  ) {}

  public handle = (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      res.status(401).json({ message: 'Invalid token format' });
      return;
    }

    try {
      const decoded = this.jwtService.verify(token, this.config.JWT_SECRET) as {
        id: string;
        email: string;
      };
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
}
