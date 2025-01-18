import { Container } from 'inversify';

import { RepositoryManagementService } from './RepositoryManagementService';
import {
  createMockLogger,
  createMockBcryptService,
  createMockGitHubClient,
  createMockRepositoryRepository,
} from '../../__mocks__/index.js';
import { RepositoryStatus } from '../../interfaces/index.js';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { TYPES } from '../../utils/types.js';

import type {
  IBcryptService,
  IGitHubClient,
  ILogger,
  IRepositoryRepository,
  IRepository,
} from '../../interfaces/index.js';

describe('RepositoryManagementService', () => {
  let container: Container;
  let service: RepositoryManagementService;
  let mockRepository: jest.Mocked<IRepositoryRepository>;
  let mockGitHubAdapter: jest.Mocked<IGitHubClient>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBcryptService: jest.Mocked<IBcryptService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a new container for each test
    container = new Container();
    mockRepository = createMockRepositoryRepository();
    mockGitHubAdapter = createMockGitHubClient();
    mockLogger = createMockLogger();
    mockBcryptService = createMockBcryptService();

    // Bind mock implementations
    container
      .bind<IRepositoryRepository>(TYPES.RepositoryRepository)
      .toConstantValue(mockRepository);
    container
      .bind<IGitHubClient>(TYPES.GitHubClient)
      .toConstantValue(mockGitHubAdapter);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<IBcryptService>(TYPES.BcryptService)
      .toConstantValue(mockBcryptService);
    container
      .bind<RepositoryManagementService>(RepositoryManagementService)
      .toSelf();

    // Create service instance
    service = container.get<RepositoryManagementService>(
      RepositoryManagementService,
    );
  });

  describe('addRepository', () => {
    const validDetails = {
      owner: 'testorg',
      name: 'testrepo',
      credentials: {
        type: 'token' as const,
        value: 'test-token',
      },
      status: RepositoryStatus.ACTIVE,
      createdAt: new Date(),
      metadata: {
        isPrivate: true,
        description: 'Test repository',
        defaultBranch: 'main',
        topics: ['test'],
        language: 'TypeScript',
      },
    };

    it('should successfully add a new repository with valid details', async () => {
      // Arrange
      const hashedToken = 'hashed-token';
      const repoMetadata = {
        isPrivate: true,
        description: 'Test repo',
        defaultBranch: 'main',
        topics: ['test'],
        primaryLanguage: 'TypeScript',
      };

      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue(repoMetadata);
      mockBcryptService.hash.mockResolvedValue(hashedToken);
      mockRepository.create.mockResolvedValue({
        ...validDetails,
        id: 'test-id',
        fullName: `${validDetails.owner}/${validDetails.name}`,
        updatedAt: expect.any(Date),
        credentials: {
          ...validDetails.credentials,
          value: hashedToken,
        },
      });

      // Act
      const result = await service.addRepository(validDetails);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.fullName).toBe(
        `${validDetails.owner}/${validDetails.name}`,
      );
      expect(result.updatedAt).toBeDefined();
      expect(mockBcryptService.hash).toHaveBeenCalledWith('test-token', 10);
      expect(mockGitHubAdapter.getRepositoryMetadata).toHaveBeenCalledWith({
        owner: validDetails.owner,
        name: validDetails.name,
        token: 'test-token', // CHANGED: Expect raw token since we validate before hashing
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Adding new repository', {
        owner: validDetails.owner,
        name: validDetails.name,
      });
    });

    it('should throw ValidationError if repository validation fails', async () => {
      // Arrange
      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addRepository(validDetails)).rejects.toThrow(
        ValidationError,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should hash credentials before storing', async () => {
      // Arrange
      const hashedToken = 'hashed-token';
      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue({
        isPrivate: true,
        defaultBranch: 'main',
      });
      mockBcryptService.hash.mockResolvedValue(hashedToken);
      mockRepository.create.mockResolvedValue({
        ...validDetails,
        id: 'test-id',
        fullName: `${validDetails.owner}/${validDetails.name}`,
        updatedAt: expect.any(Date), // Expect a Date object
        credentials: { type: 'token', value: hashedToken },
      });

      // Act
      await service.addRepository(validDetails);

      // Assert
      expect(mockBcryptService.hash).toHaveBeenCalledWith(
        validDetails.credentials.value,
        10,
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          credentials: expect.objectContaining({
            value: hashedToken,
          }),
        }),
      );
    });
  });

  describe('removeRepository', () => {
    it('should archive a repository instead of deleting it', async () => {
      // Arrange
      const repoId = 'test-id';
      const mockRepo: IRepository = {
        id: repoId,
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        status: RepositoryStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const archivedRepo: IRepository = {
        ...mockRepo,
        status: RepositoryStatus.ARCHIVED,
        updatedAt: new Date(), // Update the timestamp for the archive action
      };

      mockRepository.findById.mockResolvedValue(mockRepo);
      mockRepository.markAsArchived.mockResolvedValue(archivedRepo);

      // Act
      await service.removeRepository(repoId);

      // Assert
      expect(mockRepository.markAsArchived).toHaveBeenCalledWith(repoId);
      expect(mockLogger.info).toHaveBeenCalledWith('Removing repository', {
        repoId,
      });
    });

    it('should throw NotFoundError if repository does not exist', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeRepository('non-existent')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getRepository', () => {
    it('should return repository details with redacted credentials', async () => {
      // Arrange
      const repoId = 'test-id';
      const repo: IRepository = {
        id: repoId,
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        status: RepositoryStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        credentials: {
          type: 'token',
          value: 'secret-token',
        },
      };
      mockRepository.findById.mockResolvedValue(repo);

      // Act
      const result = await service.getRepository(repoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.credentials).toBeDefined();
      if (result.credentials) {
        // Type guard
        expect(result.credentials.value).toBe('[REDACTED]');
      } else {
        fail('Expected credentials to be defined');
      }
    });

    it('should handle repository without credentials', async () => {
      // Arrange
      const repoId = 'test-id';
      const repo: IRepository = {
        id: repoId,
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        status: RepositoryStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(repo);

      // Act
      const result = await service.getRepository(repoId);

      // Assert
      expect(result).toBeDefined();
      expect(result.credentials).toBeUndefined();
    });

    it('should throw NotFoundError for non-existent repository', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRepository('non-existent')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('listRepositories', () => {
    it('should return paginated list of repositories with redacted credentials', async () => {
      // Arrange
      const repositories = {
        items: [
          {
            id: '1',
            owner: 'testorg',
            name: 'repo1',
            fullName: 'testorg/repo1',
            status: RepositoryStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            credentials: { type: 'token' as const, value: 'secret1' },
          },
          {
            id: '2',
            owner: 'testorg',
            name: 'repo2',
            fullName: 'testorg/repo2',
            status: RepositoryStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            credentials: { type: 'token' as const, value: 'secret2' },
          },
        ],
        total: 2,
        page: 0,
        pageSize: 10,
        hasMore: false,
      };
      mockRepository.findAll.mockResolvedValue(repositories);

      // Act
      const result = await service.listRepositories();

      // Assert
      expect(result.items).toHaveLength(2);
      result.items.forEach((item, index) => {
        expect(item.credentials).toBeDefined();
        if (item.credentials) {
          expect(item.credentials.value).toBe('[REDACTED]');
        } else {
          fail(`Expected credentials to be defined for item ${index}`);
        }
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        items: [],
        status: RepositoryStatus.ACTIVE,
        owner: 'testorg',
        page: 0,
        pageSize: 10,
        hasMore: false,
      };

      // Act
      await service.listRepositories(filters);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('updateRepositoryStatus', () => {
    it('should update repository status', async () => {
      // Arrange
      const repoId = 'test-id';
      const repo: IRepository = {
        id: repoId,
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        status: RepositoryStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(repo);
      mockRepository.update.mockResolvedValue({
        ...repo,
        status: RepositoryStatus.INACTIVE,
      });

      // Act
      const result = await service.updateRepositoryStatus(
        repoId,
        RepositoryStatus.INACTIVE,
      );

      // Assert
      expect(result.status).toBe(RepositoryStatus.INACTIVE);
      expect(mockRepository.update).toHaveBeenCalledWith(
        repoId,
        expect.objectContaining({
          status: RepositoryStatus.INACTIVE,
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundError for non-existent repository', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateRepositoryStatus(
          'non-existent',
          RepositoryStatus.INACTIVE,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateRepository', () => {
    const validDetails = {
      owner: 'testorg',
      name: 'testrepo',
      credentials: {
        type: 'token' as const,
        value: 'test-token',
      },
      status: RepositoryStatus.ACTIVE,
      createdAt: new Date(),
      metadata: {
        isPrivate: true,
        description: 'Test repository',
        defaultBranch: 'main',
        topics: ['test'],
        language: 'TypeScript',
      },
    };

    it('should return validated details for valid repository', async () => {
      // Arrange
      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue({
        isPrivate: true,
        description: 'Test repo',
        defaultBranch: 'main',
      });

      // Act
      const result = await service.validateRepository(validDetails);

      // Assert
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.isPrivate).toBe(true);
      expect(result.metadata?.defaultBranch).toBe('main');
      expect(result.metadata?.description).toBe('Test repo');
    });

    it('should return details with undefined metadata for invalid repository', async () => {
      // Arrange
      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue(null);

      // Act
      const result = await service.validateRepository(validDetails);

      // Assert
      expect(result.metadata).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return details with undefined metadata when validation throws', async () => {
      // Arrange
      mockGitHubAdapter.getRepositoryMetadata.mockRejectedValue(
        new Error('API Error'),
      );

      // Act
      const result = await service.validateRepository(validDetails);

      // Assert
      expect(result.metadata).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Repository validation failed',
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
