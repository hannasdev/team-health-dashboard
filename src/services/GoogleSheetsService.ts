// src/services/GoogleSheetsService.ts
import { Metric } from "../models/Metric";
import { IGoogleSheetsService } from "../interfaces/IGoogleSheetsService";
import { IMetric } from "../interfaces/IMetricModel";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export interface IGoogleSheetsClient {
  getValues(
    spreadsheetId: string,
    range: string
  ): Promise<{
    data: {
      values: any[][];
    };
  }>;
}

export class GoogleSheetsService implements IGoogleSheetsService {
  constructor(
    private client: IGoogleSheetsClient,
    private spreadsheetId: string
  ) {}

  async fetchData(): Promise<IMetric[]> {
    try {
      const response = await this.client.getValues(this.spreadsheetId, "A:C");

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
          return new Metric(
            `sheet-${index}`,
            name,
            Number(value),
            new Date(timestamp),
            "Google Sheets"
          );
        })
        .filter((metric: IMetric | null): metric is IMetric => metric !== null);
    } catch (error) {
      console.error("Error fetching data from Google Sheets:", error);
      throw new Error("Failed to fetch data from Google Sheets");
    }
  }
}

export class GoogleSheetsAdapter implements IGoogleSheetsClient {
  private sheets;

  constructor(clientEmail: string, privateKey: string) {
    this.sheets = google.sheets({
      version: "v4",
      auth: this.getAuth(clientEmail, privateKey),
    });
  }

  private getAuth(clientEmail: string, privateKey: string): OAuth2Client {
    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }

  async getValues(spreadsheetId: string, range: string): Promise<any> {
    return this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
  }
}
