// src/interfaces/ITokenService.ts

export interface ITokenService {
  generateRefreshToken(payload: { id: string }): string;
  generatePasswordResetToken(payload: { id: string }): string;
  generateAccessToken(
    payload: { id: string; email: string },
    expiresIn?: string | number,
  ): string;
  validateAccessToken(token: string): {
    id: string;
    email: string;
    exp: number;
  };
  validatePasswordResetToken(token: string): { id: string };
  validateRefreshToken(token: string): { id: string; exp: number };
  decodeToken(token: string): any;
}
