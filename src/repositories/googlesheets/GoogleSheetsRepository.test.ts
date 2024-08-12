import { Container } from 'inversify';
import {
  IGoogleSheetsClient,
  IConfig,
  ICacheService,
  ILogger,
  IMetric,
  IGoogleSheetsRepository,
} from '../../interfaces/index.js';
import { Config } from '../../config/config.js';
import { GoogleSheetsRepository } from '../../repositories/googlesheets/GoogleSheetsRepository.js';
import { TYPES } from '../../utils/types.js';
import {
  createMockLogger,
  createMockCacheService,
  createMockGoogleSheetsClient,
} from '../../__mocks__/mockFactories.js';
import { ProgressCallback } from '../../types/index.js';

describe('GoogleSheetsRepository', () => {
  let container: Container;
  let googleSheetsRepository: IGoogleSheetsRepository;
  let mockClient: jest.Mocked<IGoogleSheetsClient>;
  let mockConfig: IConfig;
  let mockLogger: jest.Mocked<ILogger>;
  let mockCacheService: jest.Mocked<ICacheService>;

  const testConfig = {
    GITHUB_OWNER: 'github_owner_test',
    GITHUB_REPO: 'github_repo_test',
    JWT_SECRET: 'test-secret',
    GITHUB_TOKEN: 'test-github-token',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test-google-sheets-private-key',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test-client-email@example.com',
    GOOGLE_SHEETS_SHEET_ID: 'test-sheet-id',
    MONGODB_URI: 'mongodb://localhost:27017/test-db',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
  };

  beforeEach(() => {
    mockConfig = Config.getInstance(testConfig);
    mockLogger = createMockLogger();
    mockCacheService = createMockCacheService();
    mockClient = createMockGoogleSheetsClient();

    container = new Container();
    container
      .bind<IGoogleSheetsClient>(TYPES.GoogleSheetsClient)
      .toConstantValue(mockClient);
    container.bind<IConfig>(TYPES.Config).toConstantValue(mockConfig);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    container
      .bind<IGoogleSheetsRepository>(TYPES.GoogleSheetsRepository)
      .to(GoogleSheetsRepository);

    googleSheetsRepository = container.get<IGoogleSheetsRepository>(
      TYPES.GoogleSheetsRepository,
    );

    jest.resetAllMocks();
  });

  it('should fetch metrics from Google Sheets', async () => {
    const mockSheetData = {
      data: {
        values: [
          ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Additional Info'],
          [
            '2023-01-01',
            'Test Category',
            'Test Metric',
            '10',
            'count',
            'Test Info',
          ],
        ],
      },
    };

    mockClient.getValues.mockResolvedValueOnce(mockSheetData);

    const result = await googleSheetsRepository.fetchMetrics();

    expect(result).toEqual([
      expect.objectContaining<Partial<IMetric>>({
        id: 'sheet-0',
        metric_category: 'Test Category',
        metric_name: 'Test Metric',
        value: 10,
        timestamp: new Date('2023-01-01'),
        unit: 'count',
        additional_info: 'Test Info',
        source: 'Google Sheets',
      }),
    ]);

    expect(result).toHaveLength(1);

    expect(mockClient.getValues).toHaveBeenCalledWith(
      mockConfig.GOOGLE_SHEETS_ID,
      'A:F',
    );
  });

  it('should handle empty sheet data', async () => {
    mockClient.getValues.mockResolvedValueOnce({ data: { values: [] } });

    const result = await googleSheetsRepository.fetchMetrics();

    expect(result).toHaveLength(0);
  });

  it('should skip rows with insufficient data', async () => {
    const mockSheetData = {
      data: {
        values: [
          ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Additional Info'],
          ['2023-01-01', 'Test Category', 'Test Metric'], // Insufficient data
          [
            '2023-01-02',
            'Valid Category',
            'Valid Metric',
            '20',
            'count',
            'Valid Info',
          ],
        ],
      },
    };

    mockClient.getValues.mockResolvedValueOnce(mockSheetData);

    const result = await googleSheetsRepository.fetchMetrics();

    expect(result).toHaveLength(1);
    expect(result[0].metric_name).toBe('Valid Metric');
  });

  it('should call progress callback if provided', async () => {
    const mockSheetData = {
      data: {
        values: [
          ['Timestamp', 'Category', 'Name', 'Value', 'Unit', 'Additional Info'],
          [
            '2023-01-01',
            'Test Category',
            'Test Metric',
            '10',
            'count',
            'Test Info',
          ],
        ],
      },
    };

    mockClient.getValues.mockResolvedValueOnce(mockSheetData);

    const mockProgressCallback: ProgressCallback = jest.fn();

    await googleSheetsRepository.fetchMetrics(mockProgressCallback);

    expect(mockProgressCallback).toHaveBeenCalledWith(
      100,
      100,
      'Finished processing Google Sheets data',
    );
  });

  it('should handle errors during API requests', async () => {
    const error = new Error('API Error');
    mockClient.getValues.mockRejectedValue(error);

    await expect(googleSheetsRepository.fetchMetrics()).rejects.toThrow(
      'Failed to fetch data from Google Sheets: API Error',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching data from Google Sheets:',
      error,
    );
  });

  it('should use cache when available', async () => {
    const cachedMetrics: IMetric[] = [
      {
        id: 'cached-metric',
        metric_category: 'Cached Category',
        metric_name: 'Cached Metric',
        value: 100,
        timestamp: new Date(),
        unit: 'count',
        additional_info: 'Cached Info',
        source: 'Google Sheets',
      },
    ];

    mockCacheService.get.mockResolvedValueOnce(cachedMetrics);

    const result = await googleSheetsRepository.fetchMetrics();

    expect(result).toEqual(cachedMetrics);
    expect(mockClient.getValues).not.toHaveBeenCalled();
  });
});
