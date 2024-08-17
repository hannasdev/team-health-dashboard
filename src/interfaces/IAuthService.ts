// src/interfaces/IAuthService.ts
export interface IAuthService {
  validateToken(token: string): { id: string; email: string };
  generateToken(payload: { id: string; email: string }): string;
  login(email: string, password: string): Promise<string>;
  register(email: string, password: string): Promise<string>;
  refreshToken(token: string): Promise<string>;
  revokeToken(token: string): Promise<void>;
  isTokenRevoked(token: string): Promise<boolean>;
  initiatePasswordReset(email: string): Promise<void>;
  resetPassword(resetToken: string, newPassword: string): Promise<void>;
}
