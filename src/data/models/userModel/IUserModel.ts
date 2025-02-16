// src/interfaces/IUserModel.ts

export interface IUserModel {
  _id: string;
  email: string;
  password: string;
  toObject(): { _id: string; email: string; password: string };
}

export type SanitizedUser = Omit<IUserModel, 'password' | 'toObject'> & {
  toObject(): Omit<ReturnType<IUserModel['toObject']>, 'password'>;
};
