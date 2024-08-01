// src/__tests__/services/GoogleSheetsService.test.ts
import 'reflect-metadata';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { IGoogleSheetsService } from '../../interfaces/IGoogleSheetsService';
import { IGoogleSheetsClient } from '../../interfaces/IGoogleSheetsClient';
import { IConfig } from '../../interfaces/IConfig';
import { createMockLogger, MockLogger } from '../../__mocks__/logger';
import { Logger } from '../../utils/logger';
import { jest } from '@jest/globals';

describe('GoogleSheetsService', () => {
  let googleSheetsService: IGoogleSheetsService;
  let mockGoogleSheetsClient: jest.Mocked<IGoogleSheetsClient>;
  let mockConfig: IConfig;
  let mockLogger: MockLogger;

  beforeAll(() => {
    mockGoogleSheetsClient = {
      getValues: jest.fn(),
    };
    mockConfig = {
      GOOGLE_SHEETS_ID: 'fake-sheet-id',
    } as IConfig;
    mockLogger = createMockLogger();
    googleSheetsService = new GoogleSheetsService(
      mockGoogleSheetsClient,
      mockConfig,
      mockLogger as Logger,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and parse data from Google Sheets', async () => {
    const mockSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      [
        '2023-07-27T10:00:00Z',
        'Efficiency',
        'Cycle Time',
        '3',
        'days',
        'Sprint 1',
      ],
      ['2023-07-27T11:00:00Z', 'Workflow', 'WIP', '5', 'items', ''],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
          unit: 'days',
          additional_info: 'Sprint 1',
          source: 'Google Sheets',
        }),
        expect.objectContaining({
          metric_category: 'Workflow',
          metric_name: 'WIP',
          value: 5,
          unit: 'items',
          additional_info: '',
          source: 'Google Sheets',
        }),
      ]),
    );
  });

  it('should handle empty sheet data', async () => {
    const mockEmptySheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockEmptySheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(0);
  });

  it('should handle rows with missing optional fields', async () => {
    const mockSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow', 'WIP', '5'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
          unit: 'days',
          additional_info: '',
        }),
        expect.objectContaining({
          metric_category: 'Workflow',
          metric_name: 'WIP',
          value: 5,
          unit: '',
          additional_info: '',
        }),
      ]),
    );
  });

  it('should skip rows with missing essential fields', async () => {
    const mockMalformedSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow'],
      ['2023-07-27T12:00:00Z', 'Quality', 'Bug Count', '7', 'bugs'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    const result = await googleSheetsService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric_category: 'Efficiency',
          metric_name: 'Cycle Time',
          value: 3,
        }),
        expect.objectContaining({
          metric_category: 'Quality',
          metric_name: 'Bug Count',
          value: 7,
        }),
      ]),
    );
  });

  it('should log warning for rows with missing essential fields', async () => {
    const mockMalformedSheetData = [
      [
        'Timestamp',
        'Metric Category',
        'Metric Name',
        'Value',
        'Unit',
        'Additional Info',
      ],
      ['2023-07-27T10:00:00Z', 'Efficiency', 'Cycle Time', '3', 'days'],
      ['2023-07-27T11:00:00Z', 'Workflow'],
      ['2023-07-27T12:00:00Z', 'Quality', 'Bug Count', '7', 'bugs'],
    ];

    mockGoogleSheetsClient.getValues.mockResolvedValue({
      data: { values: mockMalformedSheetData },
    });

    await googleSheetsService.fetchData();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Skipping row with insufficient data: 2023-07-27T11:00:00Z,Workflow',
      ),
    );
  });

  it('should throw an error when failing to fetch data', async () => {
    mockGoogleSheetsClient.getValues.mockRejectedValue(new Error('API error'));

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      'Failed to fetch data from Google Sheets',
    );
  });

  it('should log error when failing to fetch data', async () => {
    const error = new Error('API error');
    mockGoogleSheetsClient.getValues.mockRejectedValue(error);

    await expect(googleSheetsService.fetchData()).rejects.toThrow(
      'Failed to fetch data from Google Sheets',
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching data from Google Sheets:',
      error,
    );
  });
});
