// src/interfaces/IAuthService.ts

import { User } from '../models/User.js';

export interface IAuthService {
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  register(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  revokeAllUserTokens(userId: string): Promise<void>;
  logout(refreshToken: string): Promise<void>;
}
