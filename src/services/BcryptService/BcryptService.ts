import bcrypt from 'bcrypt';
import { injectable } from 'inversify';

import type { IBcryptService } from '../../interfaces';

@injectable()
export class BcryptService implements IBcryptService {
  public async hash(
    data: string,
    saltOrRounds: string | number,
  ): Promise<string> {
    return bcrypt.hash(data, saltOrRounds);
  }

  public async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
