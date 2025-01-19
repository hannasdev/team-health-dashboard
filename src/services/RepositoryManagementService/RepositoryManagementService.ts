import { inject, injectable } from 'inversify';

import { RepositoryStatus } from '../../interfaces/index.js';
import {
  ValidationError,
  NotFoundError,
  AppError,
} from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IRepository,
  IRepositoryDetails,
  IRepositoryFilters,
  IBcryptService,
  ILogger,
  IRepositoryRepository,
  IGitHubClient,
  IRepositoryManagementService,
  IRepositoryPaginatedResponse,
} from '../../interfaces/index.js';
@injectable()
export class RepositoryManagementService
  implements IRepositoryManagementService
{
  constructor(
    @inject(TYPES.RepositoryRepository)
    private readonly repositoryRepo: IRepositoryRepository,
    @inject(TYPES.GitHubClient)
    private readonly githubAdapter: IGitHubClient,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
    @inject(TYPES.BcryptService)
    private readonly bcryptService: IBcryptService,
  ) {}

  public async addRepository(
    details: IRepositoryDetails,
  ): Promise<IRepository> {
    try {
      this.logger.info('Adding new repository', {
        owner: details.owner,
        name: details.name,
      });

      const validatedDetails = await this.validateRepository(details);

      if (!validatedDetails.metadata || !validatedDetails.metadata.isPrivate) {
        const error = new ValidationError('Repository validation failed');
        this.logger.error('Repository validation failed', error);
        throw error;
      }

      if (validatedDetails.credentials) {
        // Hash the credentials value for secure storage
        const hashedValue = await this.bcryptService.hash(
          validatedDetails.credentials.value,
          10,
        );
        validatedDetails.credentials.value = hashedValue;
      }

      const repository = await this.repositoryRepo.create(validatedDetails);
      this.logger.info('Repository created successfully', {
        id: repository.id,
      });
      return repository;
    } catch (error) {
      this.logger.error('Error creating repository:', error as Error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create repository');
    }
  }

  public async removeRepository(repoId: string): Promise<void> {
    this.logger.info('Removing repository', { repoId });

    const repository = await this.repositoryRepo.findById(repoId);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    // Archive instead of delete to preserve historical data
    await this.repositoryRepo.markAsArchived(repoId);
  }

  public async getRepository(repoId: string): Promise<IRepository> {
    try {
      const repository = await this.repositoryRepo.findById(repoId);
      if (!repository) {
        throw new NotFoundError('Repository not found');
      }

      // Don't return credential values
      if (repository.credentials) {
        repository.credentials = {
          ...repository.credentials,
          value: '[REDACTED]',
        };
      }

      return repository;
    } catch (error) {
      this.logger.error('Error fetching repository:', error as Error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError(500, 'Failed to fetch repository');
    }
  }

  public async listRepositories(
    filters?: IRepositoryFilters,
  ): Promise<IRepositoryPaginatedResponse> {
    const result = await this.repositoryRepo.findAll(filters);

    // Redact credential values in the response
    result.items = result.items.map(repo => {
      if (repo.credentials) {
        return {
          ...repo,
          credentials: {
            ...repo.credentials,
            value: '[REDACTED]',
          },
        };
      }
      return repo;
    });

    return result;
  }

  public async validateRepository(
    details: IRepositoryDetails,
  ): Promise<IRepositoryDetails> {
    try {
      this.logger.info('Validating repository', {
        owner: details.owner,
        name: details.name,
      });

      // Validate required fields
      if (!details.owner?.trim() || !details.name?.trim()) {
        throw new ValidationError(
          'Owner and name are required and cannot be empty',
        );
      }

      // Set default metadata
      const defaultMetadata = {
        isPrivate: true,
        defaultBranch: 'main',
        description: '',
        topics: [] as string[],
        language: 'unknown',
      };

      // Try to fetch metadata but don't fail if unavailable
      let metadata = defaultMetadata;

      try {
        const githubMetadata = await this.githubAdapter.getRepositoryMetadata({
          owner: details.owner,
          name: details.name,
          token: details.credentials?.value,
        });

        if (githubMetadata) {
          metadata = {
            isPrivate: githubMetadata.isPrivate,
            defaultBranch: githubMetadata.defaultBranch,
            description: githubMetadata.description || '',
            topics: githubMetadata.topics || [],
            language: githubMetadata.primaryLanguage || 'unknown',
          };
        } else {
          this.logger.warn('GitHub returned null metadata, using defaults', {
            owner: details.owner,
            name: details.name,
          });
        }
      } catch (error) {
        this.logger.warn('Failed to fetch GitHub metadata, using defaults', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Always return a valid repository with either GitHub or default metadata
      return {
        ...details,
        createdAt: details.createdAt || new Date(),
        status: details.status || RepositoryStatus.ACTIVE,
        metadata,
      };
    } catch (error) {
      this.logger.error('Repository validation failed:', error as Error);
      throw error;
    }
  }

  public async updateRepositoryStatus(
    repoId: string,
    status: RepositoryStatus,
  ): Promise<IRepository> {
    try {
      this.logger.info('Updating repository status', { repoId, status });

      // Validate status
      if (!Object.values(RepositoryStatus).includes(status)) {
        throw new ValidationError('Invalid status value');
      }

      const repository = await this.repositoryRepo.findById(repoId);
      if (!repository) {
        throw new NotFoundError('Repository not found');
      }

      return await this.repositoryRepo.update(repoId, {
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error updating repository status:', error as Error);
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update repository status');
    }
  }

  public async updateRepositorySettings(
    repoId: string,
    settings: Partial<IRepository['settings']>,
  ): Promise<IRepository> {
    try {
      const repository = await this.repositoryRepo.findById(repoId);
      if (!repository) {
        throw new NotFoundError('Repository not found');
      }

      // Ensure syncEnabled is always defined
      const settingsToUpdate = {
        syncEnabled:
          settings?.syncEnabled ?? repository.settings?.syncEnabled ?? true,
        ...(settings?.syncInterval !== undefined && {
          syncInterval: settings.syncInterval,
        }),
        ...(settings?.branchPatterns !== undefined && {
          branchPatterns: settings.branchPatterns,
        }),
        ...(settings?.labelPatterns !== undefined && {
          labelPatterns: settings.labelPatterns,
        }),
      };

      return await this.repositoryRepo.update(repoId, {
        settings: settingsToUpdate,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error removing repository:', error as Error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError(500, 'Failed to remove repository');
    }
  }
}
