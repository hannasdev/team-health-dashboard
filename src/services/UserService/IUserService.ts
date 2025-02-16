// src/interfaces/IUserService.ts
import type { IUserModel } from '../../data/models/userModel/IUserModel.js';

export interface IUserService {
  registerUser(email: string, password: string): Promise<IUserModel>;
  getUserById(id: string): Promise<IUserModel>;
  updateUserProfile(id: string, data: Partial<IUserModel>): Promise<IUserModel>;
  // Add other user-related operations as needed
}
