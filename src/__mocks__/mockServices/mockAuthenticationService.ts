import type { IAuthenticationService } from '../../interfaces/index.js';

export function createMockAuthenticationService(): jest.Mocked<IAuthenticationService> {
  return {
    login: jest.fn().mockImplementation((email, password) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          user: { id: '1', email },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        });
      }
      return Promise.reject(new Error('Invalid credentials'));
    }),
    refreshToken: jest.fn().mockImplementation(refreshToken => {
      if (refreshToken === 'valid-refresh-token') {
        return Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        });
      }
      return Promise.reject(new Error('Invalid refresh token'));
    }),
    logout: jest.fn().mockImplementation(refreshToken => {
      if (refreshToken === 'valid-refresh-token') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('Invalid refresh token'));
    }),
  };
}
