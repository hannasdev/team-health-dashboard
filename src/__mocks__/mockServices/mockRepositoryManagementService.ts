import type { IRepositoryManagementService } from '../../interfaces/index.js';

export function createMockRepositoryManagementService(): jest.Mocked<IRepositoryManagementService> {
  return {
    addRepository: jest.fn(),
    removeRepository: jest.fn(),
    getRepository: jest.fn(),
    listRepositories: jest.fn(),
    validateRepository: jest.fn(),
    updateRepositoryStatus: jest.fn(),
  };
}
