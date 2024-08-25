// src/interfaces/ITokenService.ts

export interface ITokenService {
  generateAccessToken(payload: { id: string; email: string }): string;
  generateRefreshToken(payload: { id: string }): string;
  generatePasswordResetToken(payload: { id: string }): string;
  validateAccessToken(token: string): {
    id: string;
    email: string;
    exp?: number;
  };
  validateRefreshToken(token: string): { id: string };
  validatePasswordResetToken(token: string): { id: string };
  decodeToken(token: string): any;
}
