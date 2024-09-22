// src/interfaces/IAuthenticationService.ts
import type { IUser } from './IUserModel';

export interface IAuthenticationService {
  login(
    email: string,
    password: string,
    shortLived?: boolean,
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  // Add other authentication-related operations as needed
}
