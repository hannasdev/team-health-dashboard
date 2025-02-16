// src/data/models/User.ts
import mongoose from 'mongoose';

import type { IUserModel } from './IUserModel.js';

const UserSchema = new mongoose.Schema<IUserModel>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const UserModel = mongoose.model<IUserModel>('User', UserSchema);

export const createUser = (
  _id: string,
  email: string,
  password: string,
): IUserModel => ({
  _id,
  email,
  password,
  toObject: () => ({ _id, email, password }),
});
