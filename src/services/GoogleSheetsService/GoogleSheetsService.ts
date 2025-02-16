// services/GoogleSheetsService/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';

import {
  Cacheable,
  CacheableClass,
} from '../../cross-cutting/CacheDecorator/index.js';
import { MetricModel } from '../../data/models/metricModel/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type { IGoogleSheetsService } from './IGoogleSheetsService.js';
import type { ICacheService } from '../../cross-cutting/CacheService/ICacheService.js';
import type { ILogger } from '../../cross-cutting/Logger/ILogger.js';
import type { IGoogleSheetsRepository } from '../../data/repositories/GoogleSheetsRepository/IGoogleSheetsRepository.js';
import type { IMetricsCalculator } from '../MetricsCalculator/index.js';

@injectable()
export class GoogleSheetsService
  extends CacheableClass
  implements IGoogleSheetsService
{
  constructor(
    @inject(TYPES.GoogleSheetsRepository)
    private repository: IGoogleSheetsRepository,
    @inject(TYPES.MetricCalculator)
    private metricCalculator: IMetricsCalculator,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
  }

  @Cacheable('googlesheets-raw-data', 3600) // Cache for 1 hour
  public async fetchRawData(): Promise<any[][]> {
    return await this.repository.fetchRawData();
  }

  public async fetchAndStoreMetrics(): Promise<void> {
    try {
      const rawData = await this.repository.fetchRawData();
      const metrics = this.processRawData(rawData);
      await this.repository.storeMetrics(metrics);
      this.logger.info(
        `Fetched and stored ${metrics.length} metrics from Google Sheets`,
      );
    } catch (error) {
      this.logger.error(
        'Error fetching and storing Google Sheets data:',
        error as Error,
      );
      throw new AppError(500, 'Failed to fetch and store Google Sheets data');
    }
  }

  public async getMetrics(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MetricModel[]> {
    return this.repository.getMetrics(page, pageSize);
  }

  public async syncMetrics(): Promise<void> {
    await this.fetchAndStoreMetrics();
  }

  public async getTotalMetricsCount(): Promise<number> {
    return this.repository.getTotalMetricsCount();
  }

  public async resetData(): Promise<void> {
    try {
      const beforeCount = await this.repository.getTotalMetricsCount();
      this.logger.info(`Before reset: ${beforeCount} metrics`);

      await this.repository.deleteAllMetrics();

      const remainingMetrics = await this.repository.getTotalMetricsCount();
      if (remainingMetrics > 0) {
        throw new Error(
          `Google Sheets reset failed. ${remainingMetrics} metrics remaining.`,
        );
      }

      this.logger.info('Reset Google Sheets data successfully');
    } catch (error) {
      this.logger.error('Error resetting Google Sheets data:', error as Error);
      throw new AppError(500, 'Failed to reset Google Sheets data');
    }
  }

  private processRawData(rawData: any[][]): MetricModel[] {
    const processedMetrics = rawData
      .slice(1)
      .map((row, index) => this.processRow(row, index))
      .filter((metric): metric is MetricModel => metric !== null);

    return this.metricCalculator.calculateMetrics(processedMetrics);
  }

  private processRow(row: any[], index: number): MetricModel | null {
    if (row.length < 4) {
      this.logger.warn(`Skipping row with insufficient data: ${row}`);
      return null;
    }

    const [
      timestamp,
      metric_category,
      metric_name,
      value,
      unit = '',
      additional_info = '',
    ] = row;

    if (!timestamp || !metric_category || !metric_name || value === undefined) {
      this.logger.warn(`Skipping row with missing essential data: ${row}`);
      return null;
    }

    return {
      _id: `sheet-${index}`,
      metric_category,
      metric_name,
      value: Number(value),
      timestamp: new Date(timestamp),
      unit,
      additional_info,
      source: 'Google Sheets',
    };
  }
}
