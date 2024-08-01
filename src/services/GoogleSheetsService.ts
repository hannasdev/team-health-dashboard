// src/services/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';
import type { IGoogleSheetsClient } from '../interfaces/IGoogleSheetsClient';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { IConfig } from '../interfaces/IConfig';
import { Logger } from '../utils/logger';

@injectable()
export class GoogleSheetsService implements IGoogleSheetsService {
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Config) private configService: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
  }

  async fetchData(
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

@injectable()
export class GoogleSheetsAdapter implements IGoogleSheetsClient {
  private sheets;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.sheets = google.sheets({
      version: 'v4',
      auth: this.getAuth(),
    });
  }

  private getAuth(): OAuth2Client {
    return new google.auth.JWT({
      email: this.config.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: this.config.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  async getValues(spreadsheetId: string, range: string): Promise<any> {
    return this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
  }
}
