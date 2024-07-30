// src/interfaces/IGoogleSheetsClient.ts
export interface IGoogleSheetsClient {
  getValues(
    spreadsheetId: string,
    range: string,
  ): Promise<{
    data: {
      values: any[][];
    };
  }>;
}
