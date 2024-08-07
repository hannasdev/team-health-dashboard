// src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import { config } from '@/config/config';
import { IAuthRequest } from '@/interfaces';

export const authMiddleware = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = (req.headers as any).authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
