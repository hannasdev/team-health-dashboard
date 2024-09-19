// src/services/github/GitHubService.ts
import { injectable, inject } from 'inversify';

import {
  Cacheable,
  CacheableClass,
} from '../../cross-cutting/CacheDecorator/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IGitHubRepository,
  IGitHubService,
  IMetric,
  ILogger,
  ICacheService,
} from '../../interfaces/index.js';

@injectable()
export class GitHubService extends CacheableClass implements IGitHubService {
  constructor(
    @inject(TYPES.GitHubRepository) private repository: IGitHubRepository,
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
      return await this.repository.getProcessedMetrics(page, pageSize);
    } catch (error) {
      this.logger.error('Error fetching processed metrics:', error as Error);
      throw new AppError(500, 'Failed to fetch processed metrics');
    }
  }

  public async syncData(timePeriod: number): Promise<void> {
    try {
      await this.repository.syncPullRequests(timePeriod);
      this.logger.info(`Synced GitHub data for the last ${timePeriod} days`);
    } catch (error) {
      this.logger.error('Error syncing GitHub data:', error as Error);
      throw new AppError(500, 'Failed to sync GitHub data');
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
