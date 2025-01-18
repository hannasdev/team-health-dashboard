import type { IRepositoryRepository } from '../../interfaces/index';

export const createMockRepositoryRepository =
  (): jest.Mocked<IRepositoryRepository> => ({
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      pageSize: 10,
      hasMore: false,
    }),
    update: jest.fn(),
    delete: jest.fn(),
    markAsArchived: jest.fn(),
  });
