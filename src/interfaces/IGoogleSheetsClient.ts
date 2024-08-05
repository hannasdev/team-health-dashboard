// src/interfaces/IGoogleSheetsClient.ts
export interface IGoogleSheetsClient {
  getValues(spreadsheetId: string, range: string): Promise<any>;
  getBatchValues(spreadsheetId: string, ranges: string[]): Promise<any[][][]>;
}
