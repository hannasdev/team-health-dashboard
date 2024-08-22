// src/interfaces/IAuthService.ts
import { User } from '../models/User.js';
export interface IAuthService {
  validateToken(token: string): { id: string; email: string };
  generateAccessToken(payload: { id: string; email: string }): string;
  generateRefreshToken(payload: { id: string }): string;
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  register(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  refreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  revokeToken(token: string): Promise<void>;
  isTokenRevoked(token: string): Promise<boolean>;
  initiatePasswordReset(email: string): Promise<void>;
  resetPassword(resetToken: string, newPassword: string): Promise<void>;
}
