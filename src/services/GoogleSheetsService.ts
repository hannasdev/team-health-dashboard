// src/services/GoogleSheetsService.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../utils/types';
import type { IMetric } from '../interfaces/IMetricModel';
import type { IGoogleSheetsService } from '../interfaces/IGoogleSheetsService';
import type { IGoogleSheetsClient } from '../interfaces/IGoogleSheetsClient';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { IConfig } from '../interfaces/IConfig';

@injectable()
export class GoogleSheetsService implements IGoogleSheetsService {
  private spreadsheetId: string;

  constructor(
    @inject(TYPES.GoogleSheetsClient)
    private googleSheetsClient: IGoogleSheetsClient,
    @inject(TYPES.Config) private configService: IConfig,
  ) {
    this.spreadsheetId = this.configService.GOOGLE_SHEETS_ID;
  }

  async fetchData(): Promise<IMetric[]> {
    try {
      const response = await this.googleSheetsClient.getValues(
        this.spreadsheetId,
        'A:C', // Adjust this range as needed
      );

      const rows = response.data.values;

      if (!rows || rows.length <= 1) {
        return [];
      }

      // Skip the header row
      return rows
        .slice(1)
        .map((row: any[], index: number) => {
          if (row.length !== 3) {
            console.warn(`Skipping malformed row: ${row}`);
            return null;
          }

          const [timestamp, name, value] = row;
          return {
            id: `sheet-${index}`,
            name,
            value: Number(value),
            timestamp: new Date(timestamp),
            source: 'Google Sheets',
          };
        })
        .filter((metric: IMetric | null): metric is IMetric => metric !== null);
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
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
