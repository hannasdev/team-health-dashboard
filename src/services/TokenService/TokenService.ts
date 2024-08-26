// src/services/token/TokenService.ts
import { inject, injectable } from 'inversify';

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

  generateAccessToken(payload: { id: string; email: string }): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: this.config.ACCESS_TOKEN_EXPIRY,
    });
  }

  generateRefreshToken(payload: { id: string }): string {
    return this.jwtService.sign(payload, this.config.REFRESH_TOKEN_SECRET, {
      expiresIn: this.config.REFRESH_TOKEN_EXPIRY,
    });
  }

  generatePasswordResetToken(payload: { id: string }): string {
    return this.jwtService.sign(payload, this.config.JWT_SECRET, {
      expiresIn: '1h', // Password reset tokens typically have a short lifespan
    });
  }

  validateAccessToken(token: string): {
    id: string;
    email: string;
    exp?: number;
  } {
    const decoded = this.jwtService.verify(token, this.config.JWT_SECRET) as {
      id: string;
      email: string;
      exp?: number;
    };
    return {
      id: decoded.id,
      email: decoded.email,
      exp: decoded.exp,
    };
  }

  validateRefreshToken(token: string): { id: string } {
    return this.jwtService.verify(token, this.config.REFRESH_TOKEN_SECRET) as {
      id: string;
    };
  }

  validatePasswordResetToken(token: string): { id: string } {
    return this.jwtService.verify(token, this.config.JWT_SECRET) as {
      id: string;
    };
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}

export default TokenService;
