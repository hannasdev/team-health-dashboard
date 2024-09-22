// src/interfaces/IUserRepository.ts
import type { IUser } from '../interfaces/IUserModel';

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | undefined>;
  findById(id: string): Promise<IUser | undefined>;
  create(email: string, password: string): Promise<IUser>;
  updatePassword(id: string, newPassword: string): Promise<void>;
}
