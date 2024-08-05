// GoogleSheetsDataSource.ts
import { injectable, inject } from 'inversify';

import {
  ICacheService,
  IConfig,
  IFetchDataResult,
  IGoogleSheetsClient,
  IMetric,
  IError,
} from '@/interfaces';
import { ProgressCallback } from '@/types';
import { Logger } from '@/utils/Logger';
import { TYPES } from '@/utils/types';

import { BaseDataSource } from '../base/BaseDataSource';

@injectable()
export class GoogleSheetsDataSource extends BaseDataSource {
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Logger) logger: Logger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
    @inject(TYPES.Config) config: IConfig,
  ) {
    super(logger, cacheService, config);
    this.spreadsheetId = this.config.GOOGLE_SHEETS_ID;
    if (!this.spreadsheetId) {
      this.logger.error('Google Sheets ID is not set correctly');
    }
  }

  protected getCacheKey(): string {
    return `googlesheets-${this.spreadsheetId}`;
  }

  async fetchData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult> {
    return this.getDataWithCache(
      {},
      () => this.fetchGoogleSheetsData(progressCallback),
      3600, // 1 hour cache
    );
  }

  private async fetchGoogleSheetsData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult> {
    try {
      progressCallback?.(0, 100, 'Starting to fetch data from Google Sheets');

      const rows = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:F', // This range is correct for the new structure
      );

      progressCallback?.(
        50,
        100,
        'Data fetched from Google Sheets, processing rows',
      );

      if (!rows || rows.length <= 1) {
        progressCallback?.(100, 100, 'No data found in Google Sheets');
        return {
          metrics: [],
          errors: [],
          stats: { totalRows: 0, processedRows: 0 },
        };
      }

      const metrics = this.processRows(rows);

      progressCallback?.(100, 100, 'Finished processing Google Sheets data');

      return {
        metrics,
        errors: [],
        stats: { totalRows: rows.length - 1, processedRows: metrics.length },
      };
    } catch (error) {
      const sheetsError = this.handleError(error, 'Google Sheets');
      progressCallback?.(100, 100, 'Error fetching data from Google Sheets');
      return {
        metrics: [],
        errors: [sheetsError],
        stats: { totalRows: 0, processedRows: 0 },
      };
    }
  }

  private processRows(rows: any[]): IMetric[] {
    return rows
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
      })
      .filter((metric: IMetric | null): metric is IMetric => metric !== null);
  }
}
