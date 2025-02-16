// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';

import {
  Cacheable,
  CacheableClass,
} from '../../cross-cutting/CacheDecorator/index.js';
import { MetricModel } from '../../data/models/metricModel/index.js';
import { RepositoryStatus } from '../../types/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type { ICacheService } from '../../cross-cutting/CacheService/index.js';
import type { ILogger } from '../../cross-cutting/Logger/ILogger.js';
import type { IGitHubRepository } from '../../data/repositories/GitHubRepository/index.js';
import type {
  IRepositoryFilters,
  IRepositoryRepository,
  IRepository,
} from '../../data/repositories/RepositoryRepository/interfaces/index.js';
import type { IGitHubService } from '../GitHubService/index.js';
import type { IProcessingService } from '../ProcessingService/IProcessingService.js';

@injectable()
export class GitHubService extends CacheableClass implements IGitHubService {
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.ProcessingService)
    private processingService: IProcessingService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
    @inject(TYPES.RepositoryRepository)
    private repoMetadataRepo: IRepositoryRepository,
  ) {
    super(cacheService);
  }

  @Cacheable('github-raw-data', 3600) // Cache for 1 hour
  public async fetchAndStoreRawData(timePeriod: number): Promise<void> {
    const activeRepo = await this.getActiveRepository();

    try {
      const { pullRequests, totalPRs, fetchedPRs } =
        await this.repository.fetchPullRequests(timePeriod, {
          owner: activeRepo.owner,
          name: activeRepo.name,
          token: activeRepo.credentials.value,
        });

      await this.repository.storeRawPullRequests(pullRequests);

      // CHANGED: Added repository identification to log message
      this.logger.info(
        `Fetched ${fetchedPRs} pull requests out of ${totalPRs} total PRs for repository ${activeRepo.fullName} over the last ${timePeriod} days`,
      );

      // CHANGED: Update last sync timestamp
      await this.repoMetadataRepo.update(activeRepo.id, {
        lastSyncAt: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error fetching and storing raw GitHub data for repository ${activeRepo.fullName}:`,
        error as Error,
      );
      throw new AppError(
        500,
        `Failed to fetch and store raw GitHub data for repository ${activeRepo.fullName}`,
      );
    }
  }

  public async getProcessedMetrics(
    page: number,
    pageSize: number,
  ): Promise<MetricModel[]> {
    try {
      const metrics = await this.repository.getProcessedMetrics(page, pageSize);
      this.logger.info(`Fetched ${metrics.length} metrics from GitHubService`);
      return metrics;
    } catch (error) {
      this.logger.error('Error fetching processed metrics:', error as Error);
      throw new AppError(500, 'Failed to fetch processed metrics');
    }
  }

  public async syncData(timePeriod: number): Promise<void> {
    try {
      await this.repository.syncPullRequests(timePeriod);
      this.logger.info(`Synced GitHub data for the last ${timePeriod} days`);

      await this.processingService.processGitHubData();
      this.logger.info('Processed synced GitHub data');
    } catch (error) {
      this.logger.error('Error syncing GitHub data:', error as Error);
      throw new AppError(500, 'Failed to sync GitHub data');
    }
  }

  public async resetData(): Promise<void> {
    try {
      const beforeCount = await this.repository.getTotalPRCount();
      this.logger.info(`Before reset: ${beforeCount} metrics`);

      await this.repository.deleteAllMetrics();
      this.logger.info('Deleted all GitHub metrics');

      await this.repository.resetProcessedFlags();
      this.logger.info('Reset processed flags for all pull requests');

      await this.repository.deleteAllPullRequests();
      this.logger.info('Deleted all GitHub pull requests');

      const afterCount = await this.repository.getTotalPRCount();
      this.logger.info(`After reset: ${afterCount} metrics`);

      if (afterCount > 0) {
        throw new Error(
          `GitHub reset failed. ${afterCount} metrics remaining.`,
        );
      }

      this.logger.info('Reset GitHub data successfully');
    } catch (error) {
      this.logger.error('Error resetting GitHub data:', error as Error);
      if (error instanceof Error) {
        this.logger.error('Error details:', new Error(error.message));
      } else {
        this.logger.error(
          'Unknown error occurred during reset',
          new Error('Unknown error'),
        );
      }
      throw new AppError(500, 'Failed to reset GitHub data');
    }
  }

  public async getTotalPRCount(): Promise<number> {
    try {
      return await this.repository.getTotalPRCount();
    } catch (error) {
      this.logger.error('Error getting total PR count:', error as Error);
      throw new AppError(500, 'Failed to get total PR count');
    }
  }

  private async getActiveRepository(): Promise<IRepository> {
    try {
      const filters: IRepositoryFilters = {
        status: RepositoryStatus.ACTIVE,
        syncEnabled: true,
        page: 0,
        pageSize: 1,
        sort: {
          field: 'lastSyncAt',
          order: 'desc',
        },
      };

      const repositories = await this.repoMetadataRepo.findAll(filters);

      if (!repositories.items.length) {
        throw new AppError(
          404,
          'No active repositories found with sync enabled',
        );
      }

      const repository = repositories.items[0];

      if (!repository.credentials?.value) {
        throw new AppError(
          401,
          `Repository ${repository.fullName} is missing required credentials`,
        );
      }

      return repository;
    } catch (error) {
      // Preserve original AppError if thrown, otherwise wrap in new AppError
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Error fetching active repository:', error as Error);
      throw new AppError(500, 'Failed to fetch active repository');
    }
  }
}
