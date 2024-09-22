// src/interfaces/IUserService.ts
import type { IUser } from './IUserModel.js';

export interface IUserService {
  registerUser(email: string, password: string): Promise<IUser>;
  getUserById(id: string): Promise<IUser>;
  updateUserProfile(id: string, data: Partial<IUser>): Promise<IUser>;
  // Add other user-related operations as needed
}
