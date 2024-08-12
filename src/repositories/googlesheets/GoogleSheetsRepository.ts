import { injectable, inject } from 'inversify';

import type {
  IGoogleSheetsClient,
  IGoogleSheetsRepository,
  IConfig,
  ICacheService,
  IMetric,
  ILogger,
} from '../../interfaces/index.js';
import type { ProgressCallback } from '../../types/index.js';
import { Cacheable, CacheableClass } from '../../utils/CacheDecorator.js';
import { TYPES } from '../../utils/types.js';

@injectable()
export class GoogleSheetsRepository
  extends CacheableClass
  implements IGoogleSheetsRepository
{
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.CacheService) cacheService: ICacheService,
  ) {
    super(cacheService);
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
    if (!this.spreadsheetId) {
      this.logger.error('Google Sheets ID is not set correctly');
    }
  }

  @Cacheable('googlesheets-metrics', 3600) // Cache for 1 hour
  async fetchMetrics(progressCallback?: ProgressCallback): Promise<IMetric[]> {
    try {
      progressCallback?.(0, 100, 'Starting to fetch data from Google Sheets');

      const response = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:F', // This range is correct for the new structure
      );

      progressCallback?.(
        50,
        100,
        'Data fetched from Google Sheets, processing rows',
      );

      const rows = response.data.values;

      if (!rows || rows.length <= 1) {
        progressCallback?.(100, 100, 'No data found in Google Sheets');
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

      progressCallback?.(100, 100, 'Finished processing Google Sheets data');
      return metrics;
    } catch (error) {
      this.logger.error(
        'Error fetching data from Google Sheets:',
        error as Error,
      );
      progressCallback?.(100, 100, 'Error fetching data from Google Sheets');
      throw new Error(
        `Failed to fetch data from Google Sheets: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
