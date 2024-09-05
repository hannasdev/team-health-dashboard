// src/interfaces/IUserService.ts
import { User } from '../data/models/User.js';

export interface IUserService {
  registerUser(email: string, password: string): Promise<User>;
  getUserById(id: string): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  // Add other user-related operations as needed
}
