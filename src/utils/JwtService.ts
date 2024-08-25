// src/utils/JwtService.ts

import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { IJwtService } from '../interfaces/index.js';

@injectable()
export class JwtService implements IJwtService {
  sign(payload: object, secretOrPrivateKey: string, options?: object): string {
    return jwt.sign(payload, secretOrPrivateKey, options);
  }

  verify(token: string, secretOrPublicKey: string): object | string {
    return jwt.verify(token, secretOrPublicKey);
  }

  decode(token: string): any {
    return jwt.decode(token);
  }
}
