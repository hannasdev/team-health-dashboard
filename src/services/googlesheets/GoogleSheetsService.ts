// src/services/googlesheets/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';

import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

import { BaseService } from '../BaseService';

import type {
  IGoogleSheetsClient,
  IGoogleSheetsService,
  IConfig,
  ICacheService,
  IMetric,
} from '../../interfaces';

/**
 * GoogleSheetsService
 *
 * This service is responsible for fetching and processing data from Google Sheets
 * as part of the Team Health Dashboard. It extends the BaseService to leverage
 * common functionality such as caching and logging.
 *
 * The service fetches data from a specified Google Sheets document, processes
 * the rows into metrics, and caches the results for improved performance.
 * It supports progress tracking through a callback mechanism.
 *
 * @extends BaseService
 * @implements IGoogleSheetsService
 */
@injectable()
export class GoogleSheetsService
  extends BaseService
  implements IGoogleSheetsService
{
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(logger, cacheService);
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
    if (!this.spreadsheetId) {
      this.logger.error('Google Sheets ID is not set correctly');
    }
  }

  protected getCacheKey(): string {
    return `googlesheets-${this.spreadsheetId}`;
  }

  async fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]> {
    const cacheKey = this.getCacheKey();
    return this.getDataWithCache(
      cacheKey,
      () => this.fetchGoogleSheetsData(progressCallback),
      3600, // 1 hour cache
    );
  }

  private async fetchGoogleSheetsData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]> {
    try {
      progressCallback?.(0, 'Starting to fetch data from Google Sheets');

      const response = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:F', // This range is correct for the new structure
      );

      progressCallback?.(
        50,
        'Data fetched from Google Sheets, processing rows',
      );

      const rows = response.data.values;

      if (!rows || rows.length <= 1) {
        progressCallback?.(100, 'No data found in Google Sheets');
        return [];
      }

      // Skip the header row
      const metrics = rows
        .slice(1)
        .map((row: any[], index: number) => {
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

          if (
            !timestamp ||
            !metric_category ||
            !metric_name ||
            value === undefined
          ) {
            this.logger.warn(
              `Skipping row with missing essential data: ${row}`,
            );
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
        })
        .filter((metric: IMetric | null): metric is IMetric => metric !== null);

      progressCallback?.(100, 'Finished processing Google Sheets data');
      return metrics;
    } catch (error) {
      this.logger.error(
        'Error fetching data from Google Sheets:',
        error as Error,
      );
      progressCallback?.(100, 'Error fetching data from Google Sheets');
      throw new Error(
        `Failed to fetch data from Google Sheets: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
