// GoogleSheetsAdapter.ts
import { JWT } from 'google-auth-library';
import { google, sheets_v4 } from 'googleapis';
import { injectable, inject } from 'inversify';

import { IConfig } from '../interfaces/IConfig';
import { IGoogleSheetsClient } from '../interfaces/IGoogleSheetsClient';
import { Logger } from '../utils/Logger';
import { TYPES } from '../utils/types';

@injectable()
export class GoogleSheetsAdapter extends BaseDataAdapter {
  private sheets: sheets_v4.Sheets;

  constructor(
    @inject(TYPES.Config) private config: IConfig,
    @inject(TYPES.Logger) private logger: Logger,
  ) {
    this.sheets = google.sheets({ version: 'v4', auth: this.getAuth() });
  }

  async fetchData(
    progressCallback?: ProgressCallback,
  ): Promise<IFetchDataResult> {
    // Implementation
  }

  protected getCacheKey(): string {
    // Implementation
  }

  private getAuth(): JWT {
    return new google.auth.JWT({
      email: this.config.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: this.config.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  async getValues(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      this.logger.error(
        'Error fetching data from Google Sheets:',
        error as Error,
      );
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  async getBatchValues(
    spreadsheetId: string,
    ranges: string[],
  ): Promise<any[][][]> {
    try {
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      return response.data.valueRanges?.map(range => range.values || []) || [];
    } catch (error) {
      this.logger.error(
        'Error fetching batch data from Google Sheets:',
        error as Error,
      );
      throw new Error('Failed to fetch batch data from Google Sheets');
    }
  }
}
