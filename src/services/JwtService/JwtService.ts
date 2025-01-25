// src/utils/JwtService.ts

import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import type { IJwtService } from '../../interfaces/index.js';

@injectable()
export class JwtService implements IJwtService {
  public sign(
    payload: object,
    secretOrPrivateKey: string,
    options?: object,
  ): string {
    return jwt.sign(payload, secretOrPrivateKey, options);
  }

  public verify(token: string, secretOrPublicKey: string): object | string {
    return jwt.verify(token, secretOrPublicKey);
  }

  public decode(token: string): any {
    return jwt.decode(token);
  }
}
