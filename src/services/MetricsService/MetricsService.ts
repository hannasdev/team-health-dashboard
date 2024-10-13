import { injectable, inject } from 'inversify';

import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IGitHubService,
  IGoogleSheetsService,
  ILogger,
  IMetric,
  IMetricsService,
} from '../../interfaces';

@injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @inject(TYPES.GitHubService) private githubService: IGitHubService,
    @inject(TYPES.GoogleSheetsService)
    private googleSheetsService: IGoogleSheetsService,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  public async getAllMetrics(
    page: number,
    pageSize: number,
    timePeriod?: number,
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

      this.logger.info(
        `Fetched ${githubMetrics.length} GitHub metrics and ${googleSheetsMetrics.length} Google Sheets metrics`,
      );

      const combinedMetrics = this.combineAndSortMetrics(
        githubMetrics,
        googleSheetsMetrics,
      );

      return {
        metrics: combinedMetrics.slice(0, pageSize),
        githubStats: {
          totalPRs: githubStats,
          fetchedPRs: githubMetrics.length,
          timePeriod: timePeriod || 90,
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

  public async resetAllData(): Promise<void> {
    try {
      await Promise.all([
        this.githubService.resetData(),
        this.googleSheetsService.resetData(),
      ]);

      this.logger.info('Reset all data called in MetricsService');

      const githubCount = await this.githubService.getTotalPRCount();
      const googleSheetsCount =
        await this.googleSheetsService.getTotalMetricsCount();

      this.logger.info(
        `After reset - GitHub count: ${githubCount}, Google Sheets count: ${googleSheetsCount}`,
      );

      if (githubCount > 0 || googleSheetsCount > 0) {
        throw new Error(
          `Reset failed. Remaining counts - GitHub: ${githubCount}, Google Sheets: ${googleSheetsCount}`,
        );
      }

      this.logger.info('All data reset successfully');
    } catch (error) {
      this.logger.error('Error resetting all data:', error as Error);
      throw new AppError(500, 'Failed to reset all data');
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
