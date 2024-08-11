// GoogleSheetsAdapter.ts
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { injectable, inject } from 'inversify';

import type { IGoogleSheetsClient, IConfig } from '../interfaces/index.js';
import { TYPES } from '../utils/types.js';

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
    try {
      return await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch Google Sheets data: ${(error as Error).message}`,
      );
    }
  }
}
