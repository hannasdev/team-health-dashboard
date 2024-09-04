// src/interfaces/IAuthService.ts
// src/interfaces/IAuthenticationService.ts
import { User } from '../models/User.js';

export interface IAuthenticationService {
  login(
    email: string,
    password: string,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  // Add other authentication-related operations as needed
}