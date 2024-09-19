import { injectable, inject } from 'inversify';

import { AppError } from '../../utils/errors';
import { TYPES } from '../../utils/types';

import type {
  IGitHubService,
  IGoogleSheetsService,
  ILogger,
  IMetric,
} from '../../interfaces';

@injectable()
export class MetricsService {
  constructor(
    @inject(TYPES.GitHubService) private githubService: IGitHubService,
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async getAllMetrics(
    page: number,
    pageSize: number,
  ): Promise<{
    metrics: IMetric[];
    githubStats: {
      totalPRs: number;
      fetchedPRs: number;
      timePeriod: number;
    };
    totalMetrics: number;
  }> {
    try {
      const [
        githubMetrics,
        googleSheetsMetrics,
        githubStats,
        totalGoogleSheetsMetrics,
      ] = await Promise.all([
        this.githubService.getProcessedMetrics(page, Math.ceil(pageSize / 2)),
        this.googleSheetsService.getMetrics(page, Math.ceil(pageSize / 2)),
        this.githubService.getTotalPRCount(),
        this.googleSheetsService.getTotalMetricsCount(),
      ]);

      const combinedMetrics = this.combineAndSortMetrics(
        githubMetrics,
        googleSheetsMetrics,
      );

      return {
        metrics: combinedMetrics.slice(0, pageSize),
        githubStats: {
          totalPRs: githubStats,
          fetchedPRs: githubMetrics.length,
          timePeriod: 90, // Assuming we're always fetching 90 days of data
        },
        totalMetrics: githubStats + totalGoogleSheetsMetrics,
      };
    } catch (error) {
      this.logger.error('Error fetching metrics:', error as Error);
      throw new AppError(500, 'Failed to fetch metrics');
    }
  }

  public async fetchAndStoreAllData(): Promise<void> {
    try {
      await Promise.all([
        this.githubService.fetchAndStoreRawData(90),
        this.googleSheetsService.fetchAndStoreMetrics(),
      ]);
      this.logger.info('Raw data fetched and stored successfully');
    } catch (error) {
      this.logger.error('Error fetching and storing raw data:', error as Error);
      throw new AppError(500, 'Failed to fetch and store raw data');
    }
  }

  public async syncAllData(): Promise<void> {
    try {
      await Promise.all([
        this.githubService.syncData(90),
        this.googleSheetsService.syncMetrics(),
      ]);
      this.logger.info('All data synced successfully');
    } catch (error) {
      this.logger.error('Error syncing data:', error as Error);
      throw new AppError(500, 'Failed to sync data');
    }
  }

  private combineAndSortMetrics(
    githubMetrics: IMetric[],
    googleSheetsMetrics: IMetric[],
  ): IMetric[] {
    return [...githubMetrics, ...googleSheetsMetrics].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}
