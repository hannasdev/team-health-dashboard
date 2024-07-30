// src/__tests__/services/GoogleSheetsService.test.ts
import 'reflect-metadata';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { IGoogleSheetsService } from '../../interfaces/IGoogleSheetsService';
import { IGoogleSheetsClient } from '../../interfaces/IGoogleSheetsClient';
import { IConfig } from '../../interfaces/IConfig';
import { jest } from '@jest/globals';

describe('GoogleSheetsService', () => {
  let googleSheetsService: IGoogleSheetsService;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockConfig: IConfig;

  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    mockGoogleSheetsClient = {
      getValues: jest.fn(),
    };
    mockConfig = {
      GOOGLE_SHEETS_ID: 'fake-sheet-id',
      // Add other required config properties with mock values
    } as IConfig;
    googleSheetsService = new GoogleSheetsService(
      mockGoogleSheetsClient,
      mockConfig,
    );
  });

  it('should fetch and parse data from Google Sheets', async () => {
    const mockSheetData = [
      ['Timestamp', 'Metric Name', 'Value'],
      ['2023-07-27T10:00:00Z', 'Cycle Time', '3'],
      ['2023-07-27T11:00:00Z', 'WIP', '5'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Cycle Time',
          value: 3,
          source: 'Google Sheets',
        }),
        expect.objectContaining({
          name: 'WIP',
          value: 5,
          source: 'Google Sheets',
        }),
      ]),
    );
  });
  it('should handle empty sheet data', async () => {
    const mockEmptySheetData = [['Timestamp', 'Metric Name', 'Value']];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockEmptySheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(0);
  });

  it('should skip malformed rows', async () => {
    const mockMalformedSheetData = [
      ['Timestamp', 'Metric Name', 'Value'],
      ['2023-07-27T10:00:00Z', 'Cycle Time', '3'],
      ['2023-07-27T11:00:00Z', 'WIP'],
      ['2023-07-27T12:00:00Z', 'Lead Time', '7'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Cycle Time',
          value: 3,
          source: 'Google Sheets',
        }),
        expect.objectContaining({
          name: 'Lead Time',
          value: 7,
          source: 'Google Sheets',
        }),
      ]),
    );
  });

  it('should throw an error when failing to fetch data', async () => {
    mockGoogleSheetsClient.getValues.mockRejectedValue(new Error('API error'));

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      'Failed to fetch data from Google Sheets',
    );
  });
});
