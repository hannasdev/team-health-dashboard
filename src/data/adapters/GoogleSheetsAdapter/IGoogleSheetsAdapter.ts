// src/interfaces/IGoogleSheetsClient.ts
export interface IGoogleSheetsAdapter {
  getValues(
    spreadsheetId: string,
    range: string,
  ): Promise<{
    data: {
      values: any[][];
    };
  }>;
}
