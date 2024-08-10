import { User } from '@/models/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  create(email: string, password: string): Promise<User>;
}
