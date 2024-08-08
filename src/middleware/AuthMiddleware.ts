// src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { IAuthRequest, IConfig } from '@/interfaces';

interface IJwtService {
  verify(token: string, secret: string): string | JwtPayload;
}

export const authMiddleware =
  (
    config: IConfig,
    jwtService: IJwtService = jwt, // Inject jwt service, defaulting to the real one
  ) =>
  (req: IAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const decoded = jwtService.verify(token, config.JWT_SECRET) as {
        id: string;
        email: string;
      };
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
