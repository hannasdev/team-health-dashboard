import { createUser } from '../../data/models/User.js';
import {
  UserAlreadyExistsError,
  UserNotFoundError,
} from '../../utils/errors.js';

import type { IUserService } from '../../interfaces/index.js';

export function createMockUserService(): jest.Mocked<IUserService> {
  return {
    registerUser: jest.fn().mockImplementation((email, password) => {
      if (email === 'existing@example.com') {
        return Promise.reject(new UserAlreadyExistsError());
      }
      return Promise.resolve(createUser('2', email, 'hashedPassword'));
    }),
    getUserById: jest.fn().mockImplementation(id => {
      if (id === '1') {
        return Promise.resolve(
          createUser('1', 'test@example.com', 'hashedPassword'),
        );
      }
      return Promise.reject(
        new UserNotFoundError(`User not found for id: ${id}`),
      );
    }),
    updateUserProfile: jest.fn().mockImplementation((id, data) => {
      return Promise.resolve(
        createUser(id, data.email || 'updated@example.com', 'hashedPassword'),
      );
    }),
  };
}
