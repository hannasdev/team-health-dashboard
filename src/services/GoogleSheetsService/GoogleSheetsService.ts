// services/GoogleSheetsService/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';

import {
  Cacheable,
  CacheableClass,
} from '../../cross-cutting/CacheDecorator/index.js';
import { AppError } from '../../utils/errors.js';
import { TYPES } from '../../utils/types.js';

import type {
  IGoogleSheetsRepository,
  IGoogleSheetsService,
  IMetric,
  ILogger,
  IMetricCalculator,
  ICacheService,
} from '../../interfaces/index.js';

@injectable()
export class GoogleSheetsService
  extends CacheableClass
  implements IGoogleSheetsService
{
  constructor(
    @inject(TYPES.GoogleSheetsRepository)
    private repository: IGoogleSheetsRepository,
    @inject(TYPES.MetricCalculator) private metricCalculator: IMetricCalculator,
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
  ): Promise<IMetric[]> {
    return this.repository.getMetrics(page, pageSize);
  }

  public async syncMetrics(): Promise<void> {
    await this.fetchAndStoreMetrics();
  }

  public async getTotalMetricsCount(): Promise<number> {
    return this.repository.getTotalMetricsCount();
  }

  private processRawData(rawData: any[][]): IMetric[] {
    const processedMetrics = rawData
      .slice(1)
      .map((row, index) => this.processRow(row, index))
      .filter((metric): metric is IMetric => metric !== null);

    return this.metricCalculator.calculateMetrics(processedMetrics);
  }

  private processRow(row: any[], index: number): IMetric | null {
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
      id: `sheet-${index}`,
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
