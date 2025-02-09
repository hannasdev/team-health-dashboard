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
  IRepositoryFilters,
  IBcryptService,
  ILogger,
  IRepositoryRepository,
  IGitHubClient,
  IRepositoryManagementService,
  IRepositoryPaginatedResponse,
  IRepositoryDetails,
  IRepositorySettings,
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

      // Validate and enrich repository details
      const validatedDetails = await this.validateRepository(details);

      // Ensure repository is private for security
      if (!validatedDetails.metadata?.isPrivate) {
        throw new ValidationError('Only private repositories are supported');
      }

      // Process credentials if provided
      if (validatedDetails.credentials?.value) {
        validatedDetails.credentials.value = await this.bcryptService.hash(
          validatedDetails.credentials.value,
          10,
        );
      }

      // Ensure all required fields are present
      const repositoryToCreate: IRepositoryDetails = {
        ...validatedDetails,
        status: validatedDetails.status || RepositoryStatus.ACTIVE,
        settings: this.getDefaultSettings(validatedDetails.settings),
      };

      const repository = await this.repositoryRepo.create(repositoryToCreate);

      this.logger.info('Repository created successfully', {
        id: repository.id,
        fullName: repository.fullName,
      });

      return this.redactCredentials(repository);
    } catch (error) {
      this.logger.error('Error creating repository:', error as Error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new AppError(500, 'Failed to create repository');
    }
  }

  public async removeRepository(repoId: string): Promise<void> {
    try {
      this.logger.info('Archiving repository', { repoId });

      const repository = await this.getRepositoryOrThrow(repoId);

      // Archive instead of delete
      await this.repositoryRepo.markAsArchived(repository.id);

      this.logger.info('Repository archived successfully', {
        id: repository.id,
        fullName: repository.fullName,
      });
    } catch (error) {
      this.logger.error('Error archiving repository:', error as Error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError(500, 'Failed to archive repository');
    }
  }

  public async getRepository(repoId: string): Promise<IRepository> {
    try {
      const repository = await this.getRepositoryOrThrow(repoId);
      return this.redactCredentials(repository);
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
    try {
      const result = await this.repositoryRepo.findAll(filters);
      return {
        ...result,
        items: result.items.map(repo => this.redactCredentials(repo)),
      };
    } catch (error) {
      this.logger.error('Error listing repositories:', error as Error);
      throw new AppError(500, 'Failed to list repositories');
    }
  }

  public async updateRepositoryStatus(
    repoId: string,
    status: RepositoryStatus,
  ): Promise<IRepository> {
    try {
      this.logger.info('Updating repository status', { repoId, status });

      if (!Object.values(RepositoryStatus).includes(status)) {
        throw new ValidationError('Invalid status value');
      }

      const repository = await this.getRepositoryOrThrow(repoId);

      const updated = await this.repositoryRepo.update(repository.id, {
        status,
        updatedAt: new Date(),
      });

      return this.redactCredentials(updated);
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
    settings: Partial<IRepositorySettings>,
  ): Promise<IRepository> {
    try {
      this.logger.info('Updating repository settings', { repoId });

      const repository = await this.getRepositoryOrThrow(repoId);

      // Merge existing settings with updates
      const updatedSettings = {
        ...repository.settings,
        ...settings,
        // Ensure required fields
        syncEnabled: settings.syncEnabled ?? repository.settings.syncEnabled,
      };

      const updated = await this.repositoryRepo.update(repository.id, {
        settings: updatedSettings,
        updatedAt: new Date(),
      });

      return this.redactCredentials(updated);
    } catch (error) {
      this.logger.error('Error updating repository settings:', error as Error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError(500, 'Failed to update repository settings');
    }
  }

  private async validateRepository(
    details: IRepositoryDetails,
  ): Promise<IRepositoryDetails> {
    try {
      this.logger.info('Validating repository', {
        owner: details.owner,
        name: details.name,
      });

      if (!details.owner?.trim() || !details.name?.trim()) {
        throw new ValidationError(
          'Owner and name are required and cannot be empty',
        );
      }

      const metadata = await this.fetchRepositoryMetadata(details);

      return {
        ...details,
        metadata,
      };
    } catch (error) {
      this.logger.error('Repository validation failed:', error as Error);
      throw error;
    }
  }

  private async fetchRepositoryMetadata(details: IRepositoryDetails) {
    const defaultMetadata = {
      isPrivate: true,
      defaultBranch: 'main',
      description: '',
      topics: [] as string[],
      language: 'unknown',
    };

    try {
      const githubMetadata = await this.githubAdapter.getRepositoryMetadata({
        owner: details.owner,
        name: details.name,
        token: details.credentials?.value,
      });

      if (!githubMetadata) {
        this.logger.warn('GitHub returned null metadata, using defaults', {
          owner: details.owner,
          name: details.name,
        });
        return defaultMetadata;
      }

      return {
        isPrivate: githubMetadata.isPrivate,
        defaultBranch: githubMetadata.defaultBranch,
        description: githubMetadata.description || '',
        topics: githubMetadata.topics || [],
        language: githubMetadata.primaryLanguage || 'unknown',
      };
    } catch (error) {
      this.logger.warn('Failed to fetch GitHub metadata, using defaults', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return defaultMetadata;
    }
  }

  private getDefaultSettings(
    settings?: Partial<IRepositorySettings>,
  ): IRepositorySettings {
    return {
      syncEnabled: settings?.syncEnabled ?? true,
      branchPatterns: settings?.branchPatterns ?? ['*'],
      labelPatterns: settings?.labelPatterns ?? ['*'],
      syncInterval: settings?.syncInterval ?? 3600,
    };
  }

  private async getRepositoryOrThrow(id: string): Promise<IRepository> {
    const repository = await this.repositoryRepo.findById(id);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }
    return repository;
  }

  private redactCredentials(repository: IRepository): IRepository {
    if (repository.credentials) {
      return {
        ...repository,
        credentials: {
          ...repository.credentials,
          value: '[REDACTED]',
        },
      };
    }
    return repository;
  }
}
