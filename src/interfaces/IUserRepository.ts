import { User } from '@/models/User';

export interface IUserRepository {
  waitForConnection(): Promise<void>;
  findByEmail(email: string): Promise<User | undefined>;
  create(email: string, password: string): Promise<User>;
  close(): Promise<void>;
}
