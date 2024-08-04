// src/repositories/user/UserRepository.ts
import { injectable } from 'inversify';
import { User } from '../../models/User';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class UserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async create(email: string, password: string): Promise<User> {
    const newUser = new User(uuidv4(), email, password);
    this.users.push(newUser);
    return newUser;
  }
}
