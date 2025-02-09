import { Container } from 'inversify';
import { RepositoryManagementService } from './RepositoryManagementService';
import {
  createMockLogger,
  createMockBcryptService,
  createMockGitHubClient,
  createMockRepositoryRepository,
  createMockRepositoryItem,
} from '../../__mocks__/index.js';
import { RepositoryStatus } from '../../interfaces/index.js';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { TYPES } from '../../utils/types.js';

import type {
  IBcryptService,
  IGitHubClient,
  ILogger,
  IRepositoryRepository,
  IRepositoryDetails,
  IRepositorySettings,
  IRepository,
} from '../../interfaces/index.js';

describe('RepositoryManagementService', () => {
  let container: Container;
  let service: RepositoryManagementService;
  let mockRepository: jest.Mocked<IRepositoryRepository>;
  let mockGitHubAdapter: jest.Mocked<IGitHubClient>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockBcryptService: jest.Mocked<IBcryptService>;

  const createMockDetails = (
    overrides: Partial<IRepositoryDetails> = {},
  ): IRepositoryDetails => ({
    owner: 'testorg',
    name: 'testrepo',
    credentials: {
      type: 'token' as const,
      value: 'test-token',
    },
    status: RepositoryStatus.ACTIVE,
    metadata: {
      isPrivate: true,
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
    jest.clearAllMocks();

    container = new Container();
    mockRepository = createMockRepositoryRepository();
    mockGitHubAdapter = createMockGitHubClient();
    mockLogger = createMockLogger();
    mockBcryptService = createMockBcryptService();

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

    service = container.get<RepositoryManagementService>(
      RepositoryManagementService,
    );
  });

  describe('addRepository', () => {
    it('should successfully add a private repository with valid details', async () => {
      const validDetails = createMockDetails();
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
      mockRepository.create.mockResolvedValue(
        createMockRepositoryItem({
          id: 'test-id',
          owner: validDetails.owner,
          name: validDetails.name,
          fullName: `${validDetails.owner}/${validDetails.name}`,
          status: validDetails.status,
          credentials: { type: 'token', value: hashedToken },
          settings: {
            syncEnabled: true,
            branchPatterns: ['*'],
            labelPatterns: ['*'],
            syncInterval: 3600,
          },
          metadata: {
            isPrivate: true,
            defaultBranch: 'main',
            description: '',
            topics: [],
            language: 'TypeScript',
          },
        }),
      );

      const result = await service.addRepository(validDetails);

      expect(result.id).toBe('test-id');
      expect(result.credentials?.value).toBe('[REDACTED]');
      expect(mockBcryptService.hash).toHaveBeenCalledWith('test-token', 10);
      expect(mockLogger.info).toHaveBeenCalledWith('Adding new repository', {
        owner: validDetails.owner,
        name: validDetails.name,
      });
    });

    it('should reject adding a public repository', async () => {
      const publicDetails = createMockDetails();
      const publicMetadata = {
        isPrivate: false,
        description: 'Public repo',
        defaultBranch: 'main',
        topics: [],
        primaryLanguage: 'TypeScript',
      };

      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue(publicMetadata);

      await expect(service.addRepository(publicDetails)).rejects.toThrow(
        new ValidationError('Only private repositories are supported'),
      );
    });

    it('should handle GitHub API failures gracefully', async () => {
      const details = createMockDetails();
      mockGitHubAdapter.getRepositoryMetadata.mockRejectedValue(
        new Error('API Error'),
      );
      mockBcryptService.hash.mockResolvedValue('hashed-token');
      mockRepository.create.mockResolvedValue(
        createMockRepositoryItem({
          id: 'test-id',
          owner: details.owner,
          name: details.name,
          fullName: `${details.owner}/${details.name}`,
          status: details.status,
          settings: {
            syncEnabled: true,
            branchPatterns: ['*'],
            labelPatterns: ['*'],
            syncInterval: 3600,
          },
          metadata: {
            isPrivate: true,
            defaultBranch: 'main',
            description: '',
            topics: [],
            language: 'unknown',
          },
        }),
      );

      const result = await service.addRepository(details);

      expect(result.id).toBe('test-id');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch GitHub metadata, using defaults',
        expect.any(Object),
      );
    });

    it('should use default metadata when GitHub API returns null', async () => {
      const details = createMockDetails();
      mockGitHubAdapter.getRepositoryMetadata.mockResolvedValue(null);
      mockBcryptService.hash.mockResolvedValue('hashed-token');

      const expectedRepo = createMockRepositoryItem({
        id: 'test-id',
        owner: details.owner,
        name: details.name,
        fullName: `${details.owner}/${details.name}`,
        status: details.status,
        credentials: { type: 'token', value: 'hashed-token' },
        metadata: {
          isPrivate: true,
          defaultBranch: 'main',
          description: '',
          topics: [],
          language: 'unknown',
        },
        settings: {
          syncEnabled: true,
          branchPatterns: ['*'],
          labelPatterns: ['*'],
          syncInterval: 3600,
        },
      });
      mockRepository.create.mockResolvedValue(expectedRepo);

      const result = await service.addRepository(details);

      expect(result.metadata).toEqual({
        isPrivate: true,
        defaultBranch: 'main',
        description: '',
        topics: [],
        language: 'unknown',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'GitHub returned null metadata, using defaults',
        expect.any(Object),
      );
    });

    it('should use default metadata when GitHub API fails', async () => {
      const details = createMockDetails();
      mockGitHubAdapter.getRepositoryMetadata.mockRejectedValue(
        new Error('API Error'),
      );
      mockBcryptService.hash.mockResolvedValue('hashed-token');

      const now = new Date();
      const expectedRepo = createMockRepositoryItem({
        id: 'test-id',
        owner: details.owner,
        name: details.name,
        fullName: `${details.owner}/${details.name}`,
        status: details.status,
        createdAt: now,
        updatedAt: now,
        credentials: { type: 'token', value: 'hashed-token' },
        metadata: {
          isPrivate: true,
          defaultBranch: 'main',
          description: '',
          topics: [],
          language: 'unknown',
        },
        settings: {
          syncEnabled: true,
          branchPatterns: ['*'],
          labelPatterns: ['*'],
          syncInterval: 3600,
        },
      });
      mockRepository.create.mockResolvedValue(expectedRepo);

      const result = await service.addRepository(details);

      expect(result.metadata).toEqual({
        isPrivate: true,
        defaultBranch: 'main',
        description: '',
        topics: [],
        language: 'unknown',
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch GitHub metadata, using defaults',
        expect.any(Object),
      );
    });

    it('should validate required fields', async () => {
      const invalidDetails = createMockDetails({
        owner: '', // Invalid empty owner
        name: '  ', // Invalid empty name
      });

      await expect(service.addRepository(invalidDetails)).rejects.toThrow(
        'Owner and name are required and cannot be empty',
      );
    });
  });

  describe('removeRepository', () => {
    it('should archive repository and update settings', async () => {
      const repoId = 'test-id';
      const mockRepo = createMockRepositoryItem({
        id: repoId,
        settings: {
          syncEnabled: true,
          branchPatterns: ['develop'],
          labelPatterns: ['bug'],
          syncInterval: 3600,
        },
      });

      mockRepository.findById.mockResolvedValue(mockRepo);
      mockRepository.markAsArchived.mockResolvedValue({
        ...mockRepo,
        status: RepositoryStatus.ARCHIVED,
      });

      await service.removeRepository(repoId);

      expect(mockRepository.markAsArchived).toHaveBeenCalledWith(repoId);
      expect(mockLogger.info).toHaveBeenCalledWith('Archiving repository', {
        repoId,
      });
    });

    it('should handle repository not found error', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.removeRepository('non-existent')).rejects.toThrow(
        NotFoundError,
      );
      expect(mockRepository.markAsArchived).not.toHaveBeenCalled();
    });
  });

  describe('getRepository', () => {
    it('should return repository with redacted credentials', async () => {
      const repoId = 'test-id';
      const repo = createMockRepositoryItem({
        id: repoId,
        credentials: { type: 'token', value: 'secret-token' },
      });

      mockRepository.findById.mockResolvedValue(repo);

      const result = await service.getRepository(repoId);

      expect(result.credentials?.value).toBe('[REDACTED]');
      expect(result.id).toBe(repoId);
    });

    it('should properly redact credentials when getting repository', async () => {
      const repoId = 'test-id';
      const now = new Date();
      const repo = {
        id: repoId,
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        status: RepositoryStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
        credentials: {
          type: 'token',
          value: 'secret-token',
          lastValidated: now,
        },
        settings: {
          syncEnabled: true,
          branchPatterns: ['*'],
          labelPatterns: ['*'],
          syncInterval: 3600,
        },
        metadata: {
          isPrivate: true,
          defaultBranch: 'main',
          description: '',
          topics: [],
          language: 'TypeScript',
        },
      } as IRepository;

      mockRepository.findById.mockResolvedValue(repo);

      const result = await service.getRepository(repoId);

      expect(result.credentials.value).toBe('[REDACTED]');
      expect(result.credentials.type).toBe('token');
      expect(result.credentials.lastValidated).toBe(now);
    });
  });

  describe('listRepositories', () => {
    it('should return paginated list with redacted credentials', async () => {
      const repos = {
        items: [
          createMockRepositoryItem({
            id: '1',
            credentials: { type: 'token', value: 'secret1' },
          }),
          createMockRepositoryItem({
            id: '2',
            credentials: { type: 'token', value: 'secret2' },
          }),
        ],
        total: 2,
        page: 0,
        pageSize: 10,
        hasMore: false,
      };

      mockRepository.findAll.mockResolvedValue(repos);

      const result = await service.listRepositories();

      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.credentials?.value).toBe('[REDACTED]');
      });
    });

    it('should apply complex filters correctly', async () => {
      const filters = {
        status: [RepositoryStatus.ACTIVE, RepositoryStatus.INACTIVE],
        owner: 'testorg',
        search: 'test',
        syncEnabled: true,
        page: 1,
        pageSize: 20,
      };

      await service.listRepositories(filters);

      expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('updateRepositoryStatus', () => {
    it('should update status and preserve other fields', async () => {
      const repoId = 'test-id';
      const repo = createMockRepositoryItem({
        id: repoId,
        status: RepositoryStatus.ACTIVE,
      });

      mockRepository.findById.mockResolvedValue(repo);
      mockRepository.update.mockResolvedValue({
        ...repo,
        status: RepositoryStatus.INACTIVE,
      });

      const result = await service.updateRepositoryStatus(
        repoId,
        RepositoryStatus.INACTIVE,
      );

      expect(result.status).toBe(RepositoryStatus.INACTIVE);
      expect(mockRepository.update).toHaveBeenCalledWith(
        repoId,
        expect.objectContaining({
          status: RepositoryStatus.INACTIVE,
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should validate status value', async () => {
      await expect(
        service.updateRepositoryStatus(
          'test-id',
          'invalid-status' as RepositoryStatus,
        ),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateRepositorySettings', () => {
    it('should merge new settings with existing ones', async () => {
      const repoId = 'test-id';
      const existingRepo = createMockRepositoryItem({
        id: repoId,
        settings: {
          syncEnabled: true,
          branchPatterns: ['main'],
          labelPatterns: ['bug'],
          syncInterval: 3600,
        },
      });

      const newSettings: Partial<IRepositorySettings> = {
        syncEnabled: false,
        branchPatterns: ['develop'],
      };

      mockRepository.findById.mockResolvedValue(existingRepo);
      mockRepository.update.mockResolvedValue({
        ...existingRepo,
        settings: {
          ...existingRepo.settings,
          ...newSettings,
        },
      });

      const result = await service.updateRepositorySettings(
        repoId,
        newSettings,
      );

      expect(result.settings).toEqual({
        syncEnabled: false,
        branchPatterns: ['develop'],
        labelPatterns: ['bug'],
        syncInterval: 3600,
      });
    });

    it('should handle missing repository error', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateRepositorySettings('non-existent', {
          syncEnabled: false,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
