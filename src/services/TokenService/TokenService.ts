// src/services/token/TokenService.ts
import { inject, injectable } from 'inversify';

import {
  UnauthorizedError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  ITokenService,
  IJwtService,
  IConfig,
} from '../../interfaces/index.js';

@injectable()
export class TokenService implements ITokenService {
  constructor(
    @inject(TYPES.JwtService) private jwtService: IJwtService,
    @inject(TYPES.Config) private config: IConfig,
  ) {}

  public generateAccessToken(
    payload: { id: string; email: string },
    expiresIn?: string | number,
  ): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: expiresIn || this.config.ACCESS_TOKEN_EXPIRY,
    });
  }

  public generateRefreshToken(payload: { id: string }): string {
    return this.jwtService.sign(payload, this.config.REFRESH_TOKEN_SECRET, {
      expiresIn: this.config.REFRESH_TOKEN_EXPIRY,
    });
  }

  public generatePasswordResetToken(payload: { id: string }): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: '1h', // Password reset tokens typically have a short lifespan
    });
  }

  public generateShortLivedAccessToken(payload: {
    id: string;
    email: string;
  }): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: '1m', // Set a short expiration time, e.g., 1 minute
    });
  }

  public validateAccessToken(token: string): {
    id: string;
    email: string;
    exp: number;
  } {
    try {
      const decoded = this.jwtService.verify(token, this.config.JWT_SECRET) as {
        id: string;
        email: string;
        exp: number;
      };
      return {
        id: decoded.id,
        email: decoded.email,
        exp: decoded.exp,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }

  public validateRefreshToken(token: string): { id: string; exp: number } {
    try {
      const decoded = this.jwtService.verify(
        token,
        this.config.REFRESH_TOKEN_SECRET,
      ) as { id: string; exp: number };
      return { id: decoded.id, exp: decoded.exp };
    } catch (error) {
      throw new InvalidRefreshTokenError();
    }
  }

  public validatePasswordResetToken(token: string): { id: string } {
    try {
      return this.jwtService.verify(token, this.config.JWT_SECRET) as {
        id: string;
      };
    } catch (error) {
      throw new InvalidResetTokenError();
    }
  }

  public decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}

export default TokenService;
