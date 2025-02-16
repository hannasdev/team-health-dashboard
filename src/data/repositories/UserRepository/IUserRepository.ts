// src/interfaces/IUserRepository.ts
import type { IUserModel } from '../../models/userModel/index.js';

export interface IUserRepository {
  findByEmail(email: string): Promise<IUserModel | undefined>;
  findById(id: string): Promise<IUserModel | undefined>;
  create(email: string, password: string): Promise<IUserModel>;
  updatePassword(id: string, newPassword: string): Promise<void>;
}
