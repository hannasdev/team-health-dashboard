import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { IJwtService } from '@/controllers/AuthController';

@injectable()
export class JwtService implements IJwtService {
  sign(payload: object, secretOrPrivateKey: string, options?: object): string {
    return jwt.sign(payload, secretOrPrivateKey, options);
  }
}
