// src/middleware/AuthMiddleware.ts
import { Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { IAuthRequest, IConfig, IAuthMiddleware } from '@/interfaces';
import { TYPES } from '@/utils/types';

interface IJwtService {
  verify(token: string, secret: string): string | JwtPayload;
}

@injectable()
export class AuthMiddleware implements IAuthMiddleware {
  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.JwtService) private jwtService: typeof jwt,
  ) {}

  public handle = (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): void | Response => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const decoded = this.jwtService.verify(token, this.config.JWT_SECRET) as {
        id: string;
        email: string;
      };
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}
