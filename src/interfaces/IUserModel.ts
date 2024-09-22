// src/interfaces/IUserModel.ts

export interface IUser {
  _id: string;
  email: string;
  password: string;
  toObject(): { _id: string; email: string; password: string };
}

export type SanitizedUser = Omit<IUser, 'password' | 'toObject'> & {
  toObject(): Omit<ReturnType<IUser['toObject']>, 'password'>;
};
