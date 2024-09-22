// src/data/models/User.ts
import mongoose from 'mongoose';

import type { IUser } from '../../interfaces/IUserModel';

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const User = mongoose.model<IUser>('User', UserSchema);

export const createUser = (
  _id: string,
  email: string,
  password: string,
): IUser => ({
  _id,
  email,
  password,
  toObject: () => ({ _id, email, password }),
});
