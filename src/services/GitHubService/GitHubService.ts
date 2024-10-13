// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';

import {
  Cacheable,
  CacheableClass,
} from '../../cross-cutting/CacheDecorator/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  ICacheService,
  IGitHubRepository,
  IGitHubService,
  ILogger,
  IMetric,
  IProcessingService,
} from '../../interfaces/index.js';

@injectable()
export class GitHubService extends CacheableClass implements IGitHubService {
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
    @inject(TYPES.ProcessingService)
    private processingService: IProcessingService,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
  }

  @Cacheable('github-raw-data', 3600) // Cache for 1 hour
  public async fetchAndStoreRawData(timePeriod: number): Promise<void> {
    try {
      const { pullRequests, totalPRs, fetchedPRs } =
        await this.repository.fetchPullRequests(timePeriod);
      await this.repository.storeRawPullRequests(pullRequests);
      this.logger.info(
        `Fetched ${fetchedPRs} pull requests out of ${totalPRs} total PRs for the last ${timePeriod} days`,
      );
    } catch (error) {
      this.logger.error(
        'Error fetching and storing raw GitHub data:',
        error as Error,
      );
      throw new AppError(500, 'Failed to fetch and store raw GitHub data');
    }
  }

  public async getProcessedMetrics(
    page: number,
    pageSize: number,
  ): Promise<IMetric[]> {
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
}
