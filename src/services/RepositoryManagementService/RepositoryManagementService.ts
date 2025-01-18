import { inject, injectable } from 'inversify';

import { RepositoryStatus } from '../../interfaces/index.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
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

  async addRepository(details: IRepositoryDetails): Promise<IRepository> {
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
    return await this.repositoryRepo.create(validatedDetails);
  }

  async removeRepository(repoId: string): Promise<void> {
    this.logger.info('Removing repository', { repoId });

    const repository = await this.repositoryRepo.findById(repoId);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    // Archive instead of delete to preserve historical data
    await this.repositoryRepo.markAsArchived(repoId);
  }

  async getRepository(repoId: string): Promise<IRepository> {
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
  }

  async listRepositories(
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

  async validateRepository(
    details: IRepositoryDetails,
  ): Promise<IRepositoryDetails> {
    try {
      // Attempt to fetch repository metadata using GitHub API
      const metadata = await this.githubAdapter.getRepositoryMetadata({
        owner: details.owner,
        name: details.name,
        token: details.credentials?.value,
      });

      // Update repository with metadata if it exists
      if (metadata) {
        return {
          // Return a new object with updated metadata
          ...details,
          metadata: {
            isPrivate: metadata.isPrivate,
            description: metadata.description,
            defaultBranch: metadata.defaultBranch,
            topics: metadata.topics,
            language: metadata.primaryLanguage,
          },
        };
      } else {
        this.logger.error('Repository metadata not found');
        return {
          ...details,
          metadata: undefined,
        };
      }
    } catch (error) {
      this.logger.error('Repository validation failed', error as Error, {
        owner: details.owner,
        name: details.name,
      });
      return {
        ...details,
        metadata: undefined,
      };
    }
  }

  async updateRepositoryStatus(
    repoId: string,
    status: RepositoryStatus,
  ): Promise<IRepository> {
    const repository = await this.repositoryRepo.findById(repoId);
    if (!repository) {
      throw new NotFoundError('Repository not found');
    }

    return await this.repositoryRepo.update(repoId, {
      status,
      updatedAt: new Date(),
    });
  }

  async updateRepositorySettings(
    repoId: string,
    settings: Partial<IRepository['settings']>,
  ): Promise<IRepository> {
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
  }
}
