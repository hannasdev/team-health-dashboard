import { injectable, inject } from 'inversify';

import { AppError } from '../../../utils/errors.js';
import { TYPES } from '../../../utils/types.js';
import { GoogleSheetsMetricModel } from '../../models/googleSheetsMetricModel/index.js';
import { MetricModel } from '../../models/metricModel/index.js';

import type { IGoogleSheetsRepository } from './IGoogleSheetsRepository.js';
import type { IConfig } from '../../../cross-cutting/Config/IConfig.js';
import type { ILogger } from '../../../cross-cutting/Logger/ILogger.js';
import type { IGoogleSheetsAdapter } from '../../adapters/GoogleSheetsAdapter/IGoogleSheetsAdapter.js';
import type { IMetricDocument } from '../../models/metricModel/index.js';

/**
 * Implements the `IGoogleSheetsRepository` interface and provides methods to fetch and store metrics from Google Sheets.
 *
 * This class is responsible for:
 * - Fetching data from Google Sheets and processing the rows
 * - Storing the metrics in the database
 * - Retrieving the metrics from the database
 *
 * The class uses caching to improve performance and reduce the number of requests to Google Sheets.
 */
@injectable()
export class GoogleSheetsRepository implements IGoogleSheetsRepository {
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsAdapter)
    private googleSheetsClient: IGoogleSheetsAdapter,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.GoogleSheetsMetricModel)
    private GoogleSheetsMetric: typeof GoogleSheetsMetricModel,
  ) {
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
    if (!this.spreadsheetId) {
      this.logger.error('Google Sheets ID is not set correctly');
    }
  }

  public async fetchRawData(): Promise<any[][]> {
    try {
      this.logger.info('Starting to fetch data from Google Sheets');
      const response = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:F',
      );
      this.logger.info('Data fetched from Google Sheets');
      return response.data.values;
    } catch (error) {
      this.logger.error(
        'Failed to fetch data from Google Sheets:',
        error as Error,
      );
      throw new AppError(
        500,
        `Failed to fetch data from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public async storeMetrics(metrics: IMetricDocument[]): Promise<void> {
    try {
      await this.GoogleSheetsMetric.insertMany(
        metrics.map(metric => ({
          metric_category: metric.metric_category,
          metric_name: metric.metric_name,
          value: metric.value,
          timestamp: metric.timestamp,
          unit: metric.unit,
          additional_info: metric.additional_info,
          source: metric.source,
        })),
      );
      this.logger.info(`Stored ${metrics.length} metrics`);
    } catch (error) {
      this.logger.error('Error storing metrics:', error as Error);
      throw new AppError(500, 'Failed to store metrics');
    }
  }

  public async getMetrics(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MetricModel[]> {
    try {
      const skip = (page - 1) * pageSize;
      const metrics = await this.GoogleSheetsMetric.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec();

      return metrics.map(metric => ({
        _id: metric._id.toString(),
        metric_category: metric.metric_category,
        metric_name: metric.metric_name,
        value: metric.value,
        timestamp: metric.timestamp,
        unit: metric.unit,
        additional_info: metric.additional_info,
        source: metric.source,
      }));
    } catch (error) {
      this.logger.error(
        'Error fetching metrics from database:',
        error as Error,
      );
      throw new AppError(500, 'Failed to fetch metrics from database');
    }
  }

  public async getTotalMetricsCount(): Promise<number> {
    try {
      return await this.GoogleSheetsMetric.countDocuments();
    } catch (error) {
      this.logger.error('Error counting metrics:', error as Error);
      throw new AppError(500, 'Failed to count metrics');
    }
  }

  public async updateMetrics(metrics: IMetricDocument[]): Promise<void> {
    try {
      for (const metric of metrics) {
        await this.GoogleSheetsMetric.findOneAndUpdate(
          { _id: metric._id },
          metric,
          { upsert: true, new: true },
        );
      }
      this.logger.info(`Updated ${metrics.length} metrics`);
    } catch (error) {
      this.logger.error('Error updating metrics:', error as Error);
      throw new AppError(500, 'Failed to update metrics');
    }
  }

  public async deleteAllMetrics(): Promise<void> {
    try {
      await this.GoogleSheetsMetric.deleteMany({});
      this.logger.info('Deleted all Google Sheets metrics');
    } catch (error) {
      this.logger.error(
        'Error deleting Google Sheets metrics:',
        error as Error,
      );
      throw new AppError(500, 'Failed to delete Google Sheets metrics');
    }
  }
}
