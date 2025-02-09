import { Container } from 'inversify';
import { RepositoryStatus } from '../../../interfaces';
import { RepositoryRepository } from './RepositoryRepository';
import { TYPES } from '../../../utils/types';
import {
  createMockCacheService,
  createMockLogger,
  createMockRepositoryItem,
} from '../../../__mocks__';

import type {
  IRepository,
  ICacheService,
  ILogger,
  IRepositoryDetails,
  IRepositoryFilters,
  IMongoAdapter,
} from '../../../interfaces';

describe('RepositoryRepository', () => {
  let container: Container;
  let repositoryRepository: RepositoryRepository;
  let mockMongoAdapter: jest.Mocked<IMongoAdapter<IRepository>>;
  let mockCacheService: jest.Mocked<ICacheService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockMongoAdapter = {
      setModel: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    mockCacheService = createMockCacheService();
    mockLogger = createMockLogger();

    container = new Container();
    container
      .bind<IMongoAdapter<IRepository>>(TYPES.MongoAdapter)
      .toConstantValue(mockMongoAdapter);
    container.bind(TYPES.CacheService).toConstantValue(mockCacheService);
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(RepositoryRepository).toSelf();

    repositoryRepository = container.get(RepositoryRepository);
  });

  describe('create', () => {
    const createMockDetails = (): IRepositoryDetails => ({
      owner: 'testOwner',
      name: 'testRepo',
      status: RepositoryStatus.ACTIVE,
      credentials: {
        type: 'token',
        value: 'test-token',
      },
      metadata: {
        isPrivate: false,
        defaultBranch: 'main',
        description: 'Test repository',
        topics: ['test'],
        language: 'TypeScript',
      },
      settings: {
        syncEnabled: true,
        branchPatterns: ['*'],
        labelPatterns: ['*'],
        syncInterval: 3600,
      },
    });

    it('should create a repository and invalidate cache', async () => {
      const mockDetails = createMockDetails();
      const mockSavedRepo = createMockRepositoryItem({
        owner: mockDetails.owner,
        name: mockDetails.name,
        fullName: `${mockDetails.owner}/${mockDetails.name}`,
        metadata: {
          isPrivate: mockDetails.metadata?.isPrivate ?? false,
          defaultBranch: mockDetails.metadata?.defaultBranch ?? 'main',
          description: mockDetails.metadata?.description ?? '',
          topics: mockDetails.metadata?.topics ?? [],
          language: mockDetails.metadata?.language ?? '',
        },
        settings: {
          syncEnabled: mockDetails.settings?.syncEnabled ?? true,
          branchPatterns: mockDetails.settings?.branchPatterns ?? ['*'],
          labelPatterns: mockDetails.settings?.labelPatterns ?? ['*'],
          syncInterval: mockDetails.settings?.syncInterval ?? 3600,
        },
      });

      mockMongoAdapter.create.mockResolvedValue(mockSavedRepo);

      const result = await repositoryRepository.create(mockDetails);

      expect(result).toEqual(mockSavedRepo);
      expect(mockCacheService.delete).toHaveBeenCalledWith('repositories:all');
      expect(mockMongoAdapter.create).toHaveBeenCalledWith(mockDetails);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log and rethrow error if creation fails', async () => {
      const error = new Error('DB Error');
      mockMongoAdapter.create.mockRejectedValue(error);

      await expect(
        repositoryRepository.create(createMockDetails()),
      ).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating repository:',
        error,
      );
    });
  });

  describe('findById', () => {
    const mockId = 'test-id';
    const mockRepo = createMockRepositoryItem({ id: mockId });

    it('should return cached repository if available', async () => {
      mockCacheService.get.mockResolvedValue(mockRepo);

      const result = await repositoryRepository.findById(mockId);

      expect(result).toEqual(mockRepo);
      expect(mockCacheService.get).toHaveBeenCalledWith(`repository:${mockId}`);
      expect(mockMongoAdapter.findById).not.toHaveBeenCalled();
    });

    it('should fetch and cache repository when not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockMongoAdapter.findById.mockResolvedValue(mockRepo);

      const result = await repositoryRepository.findById(mockId);

      expect(result).toEqual(mockRepo);
      expect(mockMongoAdapter.findById).toHaveBeenCalledWith(mockId);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `repository:${mockId}`,
        mockRepo,
        300,
      );
    });

    it('should return null when repository is not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockMongoAdapter.findById.mockResolvedValue(null);

      const result = await repositoryRepository.findById(mockId);

      expect(result).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should use default pagination values when not provided', async () => {
      const mockRepos = [
        createMockRepositoryItem(),
        createMockRepositoryItem(),
      ];
      mockMongoAdapter.findAll.mockResolvedValue({
        items: mockRepos,
        total: 2,
      });

      await repositoryRepository.findAll();

      expect(mockMongoAdapter.findAll).toHaveBeenCalledWith(
        {}, // empty query
        { createdAt: -1 }, // default sort
        0, // default skip
        10, // default limit
      );
    });

    it('should correctly apply complex filters', async () => {
      const filters: IRepositoryFilters = {
        status: [RepositoryStatus.ACTIVE, RepositoryStatus.INACTIVE],
        owner: 'testOwner',
        search: 'test',
        syncEnabled: true,
        createdBefore: new Date('2024-01-01'),
        createdAfter: new Date('2023-01-01'),
        page: 2,
        pageSize: 15,
        sort: { field: 'name', order: 'asc' },
      };

      mockMongoAdapter.findAll.mockResolvedValue({ items: [], total: 0 });

      await repositoryRepository.findAll(filters);

      expect(mockMongoAdapter.findAll).toHaveBeenCalledWith(
        {
          status: { $in: filters.status },
          owner: filters.owner,
          $or: [
            { name: { $regex: filters.search, $options: 'i' } },
            { fullName: { $regex: filters.search, $options: 'i' } },
            {
              'metadata.description': { $regex: filters.search, $options: 'i' },
            },
          ],
          'settings.syncEnabled': filters.syncEnabled,
          createdAt: {
            $lte: filters.createdBefore,
            $gte: filters.createdAfter,
          },
        },
        { name: 1 },
        30,
        15,
      );
    });

    it('should calculate hasMore correctly', async () => {
      const mockRepos = Array(5)
        .fill(null)
        .map(() => createMockRepositoryItem());
      mockMongoAdapter.findAll.mockResolvedValue({
        items: mockRepos,
        total: 12,
      });

      const result = await repositoryRepository.findAll({
        page: 1,
        pageSize: 5,
      });

      expect(result).toEqual({
        items: mockRepos,
        total: 12,
        page: 1,
        pageSize: 5,
        hasMore: true, // 5 + 5 < 12
      });
    });
  });

  describe('update', () => {
    const mockId = 'test-id';

    it('should update repository and invalidate cache', async () => {
      const updates = {
        name: 'updatedName',
        settings: {
          syncEnabled: false,
          branchPatterns: ['main'],
          labelPatterns: ['bug'],
          syncInterval: 7200,
        },
      };
      const mockUpdatedRepo = createMockRepositoryItem({
        id: mockId,
        ...updates,
      });

      mockMongoAdapter.update.mockResolvedValue(mockUpdatedRepo);

      const result = await repositoryRepository.update(mockId, updates);

      expect(result).toEqual(mockUpdatedRepo);
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        `repository:${mockId}`,
      );
      expect(mockCacheService.delete).toHaveBeenCalledWith('repositories:all');
    });

    it('should throw error when repository is not found', async () => {
      mockMongoAdapter.update.mockResolvedValue(null);

      await expect(
        repositoryRepository.update(mockId, { name: 'test' }),
      ).rejects.toThrow('Repository not found');
    });
  });

  describe('delete', () => {
    it('should throw error as deletion is not supported', async () => {
      await expect(repositoryRepository.delete('test-id')).rejects.toThrow(
        'Direct deletion is not supported',
      );

      expect(mockMongoAdapter.delete).not.toHaveBeenCalled();
    });
  });

  describe('markAsArchived', () => {
    const mockId = 'test-id';

    it('should preserve existing settings when archiving', async () => {
      const existingRepo = createMockRepositoryItem({
        id: mockId,
        settings: {
          syncEnabled: true,
          branchPatterns: ['develop', 'main'],
          labelPatterns: ['bug', 'feature'],
          syncInterval: 3600,
        },
      });

      mockMongoAdapter.findById.mockResolvedValue(existingRepo);
      mockMongoAdapter.update.mockResolvedValue({
        ...existingRepo,
        status: RepositoryStatus.ARCHIVED,
        settings: {
          ...existingRepo.settings,
          syncEnabled: false,
        },
      });

      const result = await repositoryRepository.markAsArchived(mockId);

      expect(result.status).toBe(RepositoryStatus.ARCHIVED);
      expect(result.settings).toEqual({
        ...existingRepo.settings,
        syncEnabled: false,
      });
    });

    it('should throw error when repository to archive is not found', async () => {
      mockMongoAdapter.findById.mockResolvedValue(null);

      await expect(repositoryRepository.markAsArchived(mockId)).rejects.toThrow(
        'Repository not found',
      );
    });
  });
});
