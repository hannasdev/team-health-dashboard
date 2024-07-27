import { google } from "googleapis";
import { IMetric, Metric } from "../models/Metric";

export class GoogleSheetsService {
  private sheets;

  constructor(private spreadsheetId: string) {
    this.sheets = google.sheets({ version: "v4", auth: this.getAuth() });
  }

  private getAuth() {
    // Implement authentication logic here
    // This could be loading credentials from a file or environment variables
    // For now, we'll return null as we're mocking in tests
    return null;
  }

  async fetchData(): Promise<IMetric[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "A:C", // Adjust this range as needed
      });

      const rows = response.data.values;

      if (!rows || rows.length <= 1) {
        return [];
      }

      // Skip the header row
      return rows.slice(1).map((row, index) => {
        if (row.length !== 3) {
          throw new Error("Malformed sheet data");
        }

        const [timestamp, name, value] = row;
        return new Metric(
          `sheet-${index}`,
          name,
          Number(value),
          new Date(timestamp)
        );
      });
    } catch (error) {
      console.error("Error fetching data from Google Sheets:", error);
      throw error;
    }
  }
}
