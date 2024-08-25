// src/interfaces/IUserRepository.ts

import { User } from '../models/User.js';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(email: string, password: string): Promise<User>;
  updatePassword(id: string, newPassword: string): Promise<void>;
}
