import { User } from '../models/User.js';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  create(email: string, password: string): Promise<User>;
}
