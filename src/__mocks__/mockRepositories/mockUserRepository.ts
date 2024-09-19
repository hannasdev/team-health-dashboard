import type { IUserRepository } from '../../interfaces/index';

export function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  } as unknown as jest.Mocked<IUserRepository>;
}
