import { Model, Types, SortOrder } from 'mongoose';
import { MongoAdapter } from './MongoAdapter';
import type {
  ILogger,
  IRepositoryDocument,
  IRepository,
  IRepositoryDetails,
} from '../../../interfaces';
import { RepositoryStatus } from '../../../interfaces/index.js';
import { AppError } from '../../../utils/errors';
import { createMockLogger } from '../../../__mocks__/mockUtils/mockLogger';

describe('MongoAdapter', () => {
  let adapter: MongoAdapter<IRepository>;
  let MockModel: jest.Mock & Partial<Model<IRepositoryDocument>>;
  let mockLogger: jest.Mocked<ILogger>;

  // Helper function to create a mock repository details
  const createMockRepositoryDetails = (
    overrides: Partial<IRepositoryDetails> = {},
  ): IRepositoryDetails => ({
    owner: 'testOwner',
    name: 'testRepo',
    credentials: {
      type: 'token',
      value: 'test-token',
    },
    status: RepositoryStatus.ACTIVE,
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
    ...overrides,
  });

  beforeEach(() => {
    mockLogger = createMockLogger();

    // Create mock model with all required methods
    MockModel = jest.fn().mockImplementation(data => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        toObject: () => ({
          _id: new Types.ObjectId(),
          ...data,
        }),
      }),
    }));

    // Setup static methods
    Object.assign(MockModel, {
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    });

    adapter = new MongoAdapter(mockLogger);
    adapter.setModel(MockModel as unknown as Model<IRepositoryDocument>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new repository with default values when optional fields are not provided', async () => {
      const minimalData: IRepositoryDetails = {
        owner: 'testOwner',
        name: 'testRepo',
        status: RepositoryStatus.ACTIVE,
        credentials: {
          type: 'token',
          value: 'test-token',
        },
      };

      const result = await adapter.create(minimalData);

      expect(result).toMatchObject({
        owner: minimalData.owner,
        name: minimalData.name,
        fullName: `${minimalData.owner}/${minimalData.name}`,
        settings: {
          syncEnabled: true,
          branchPatterns: ['*'],
          labelPatterns: ['*'],
        },
        metadata: {
          isPrivate: false,
          defaultBranch: 'main',
          topics: [],
        },
      });
      expect(result.id).toBeDefined();
    });

    it('should create a repository with all provided values', async () => {
      const fullData = createMockRepositoryDetails();
      const result = await adapter.create(fullData);

      expect(result).toMatchObject({
        owner: fullData.owner,
        name: fullData.name,
        fullName: `${fullData.owner}/${fullData.name}`,
        settings: fullData.settings,
        metadata: fullData.metadata,
      });
    });

    it('should throw AppError with appropriate message when database operation fails', async () => {
      const mockData = createMockRepositoryDetails();
      const dbError = new Error('Database connection failed');

      const mockInstance = {
        save: jest.fn().mockRejectedValue(dbError),
      };
      MockModel.mockImplementation(() => mockInstance);

      await expect(adapter.create(mockData)).rejects.toThrow(
        new AppError(500, `Failed to create entity: ${dbError.message}`),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating entity:',
        dbError,
      );
    });
  });

  describe('findById', () => {
    it('should return null when repository is not found', async () => {
      (MockModel.findById as jest.Mock).mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve(null),
        }),
      });

      const result = await adapter.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return repository when found', async () => {
      const mockId = new Types.ObjectId();
      const mockData = createMockRepositoryDetails();

      (MockModel.findById as jest.Mock).mockReturnValue({
        lean: () => ({
          exec: () =>
            Promise.resolve({
              _id: mockId,
              ...mockData,
              fullName: `${mockData.owner}/${mockData.name}`,
            }),
        }),
      });

      const result = await adapter.findById(mockId.toString());
      expect(result).toMatchObject({
        id: mockId.toString(),
        ...mockData,
        fullName: `${mockData.owner}/${mockData.name}`,
      });
    });

    it('should throw AppError when database operation fails', async () => {
      const dbError = new Error('Database error');
      (MockModel.findById as jest.Mock).mockReturnValue({
        lean: () => ({
          exec: () => Promise.reject(dbError),
        }),
      });

      await expect(adapter.findById('test-id')).rejects.toThrow(
        new AppError(500, `Failed to find entity by id: ${dbError.message}`),
      );
    });
  });

  describe('findAll', () => {
    it('should return empty result when no repositories exist', async () => {
      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (MockModel.find as jest.Mock).mockReturnValue(mockQueryChain);

      (MockModel.countDocuments as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve(0),
      });

      const result = await adapter.findAll();
      expect(result).toEqual({ items: [], total: 0 });
    });

    it('should apply filters, sorting, and pagination correctly', async () => {
      const mockItems = [createMockRepositoryDetails()];
      const filters = { status: RepositoryStatus.ACTIVE };
      const sort = { createdAt: 'desc' as SortOrder };
      const skip = 0;
      const limit = 10;

      const mockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(
          mockItems.map(item => ({
            _id: new Types.ObjectId(),
            ...item,
            fullName: `${item.owner}/${item.name}`,
          })),
        ),
      };

      (MockModel.find as jest.Mock).mockReturnValue(mockQueryChain);

      (MockModel.countDocuments as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve(mockItems.length),
      });

      const result = await adapter.findAll(filters, sort, skip, limit);

      expect(MockModel.find).toHaveBeenCalledWith(filters);
      expect(result.total).toBe(mockItems.length);
      expect(result.items).toHaveLength(mockItems.length);
    });
  });

  describe('update', () => {
    it('should update repository with new values', async () => {
      const mockId = new Types.ObjectId();
      const updates = {
        status: RepositoryStatus.INACTIVE,
        settings: {
          syncEnabled: false,
          branchPatterns: ['*'],
          labelPatterns: ['*'],
          syncInterval: 3600,
        },
      };

      (MockModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: () => ({
          exec: () =>
            Promise.resolve({
              _id: mockId,
              ...createMockRepositoryDetails(),
              ...updates,
            }),
        }),
      });

      const result = await adapter.update(mockId.toString(), updates);
      expect(result).toMatchObject({
        id: mockId.toString(),
        status: updates.status,
        settings: expect.objectContaining(updates.settings),
      });
    });

    it('should return null when repository is not found', async () => {
      (MockModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve(null),
        }),
      });

      const result = await adapter.update('non-existent-id', {});
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete repository successfully', async () => {
      (MockModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve({}),
      });

      await expect(adapter.delete('test-id')).resolves.not.toThrow();
    });

    it('should throw AppError when deletion fails', async () => {
      const dbError = new Error('Deletion failed');
      (MockModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: () => Promise.reject(dbError),
      });

      await expect(adapter.delete('test-id')).rejects.toThrow(AppError);
    });
  });

  describe('count', () => {
    it('should return correct count with filters', async () => {
      const filters = { status: RepositoryStatus.ACTIVE };
      const expectedCount = 5;

      (MockModel.countDocuments as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve(expectedCount),
      });

      const result = await adapter.count(filters);
      expect(result).toBe(expectedCount);
      expect(MockModel.countDocuments).toHaveBeenCalledWith(filters);
    });

    it('should return zero when no repositories match filters', async () => {
      (MockModel.countDocuments as jest.Mock).mockReturnValue({
        exec: () => Promise.resolve(0),
      });

      const result = await adapter.count({ status: RepositoryStatus.ARCHIVED });
      expect(result).toBe(0);
    });
  });
});
