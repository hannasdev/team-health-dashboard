import bcrypt from 'bcrypt';
import { injectable } from 'inversify';

import { IBcryptService } from '../../interfaces/index.js';

@injectable()
export class BcryptService implements IBcryptService {
  async hash(data: string, saltOrRounds: string | number): Promise<string> {
    return bcrypt.hash(data, saltOrRounds);
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
