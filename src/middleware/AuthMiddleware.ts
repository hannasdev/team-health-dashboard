// src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { IAuthRequest } from './../interfaces/IAuthRequest';
import { config } from '../config/config';

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
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
