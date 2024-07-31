import 'reflect-metadata';
import { MetricsService } from '../../services/MetricsService';
import { IGoogleSheetsService } from '../../interfaces/IGoogleSheetsService';
import { IGitHubService } from '../../interfaces/IGitHubService';
import { IMetricsService } from '../../interfaces/IMetricsService';
import { createMockLogger, MockLogger } from '../../__mocks__/logger';
import { Logger } from '../../utils/logger';
import { jest } from '@jest/globals';

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsService: jest.Mocked<IGoogleSheetsService>;
  let mockGitHubService: jest.Mocked<IGitHubService>;
  let mockLogger: MockLogger;

  beforeAll(() => {
    mockGoogleSheetsService = {
      fetchData: jest.fn(),
    };
    mockGitHubService = {
      fetchData: jest.fn(),
    };
    mockLogger = createMockLogger();
    metricsService = new MetricsService(
      mockGoogleSheetsService,
      mockGitHubService,
      mockLogger as Logger,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and combine metrics from Google Sheets and GitHub', async () => {
    const mockSheetMetrics = [
      {
        id: 'sheet-1',
        name: 'Cycle Time',
        value: 3,
        timestamp: new Date('2023-07-27T10:00:00Z'),
        source: 'Google Sheets',
      },
    ];
    const mockGitHubMetrics = [
      {
        id: 'github-1',
        name: 'PR Cycle Time',
        value: 48,
        timestamp: new Date(),
        source: 'GitHub',
      },
      {
        id: 'github-2',
        name: 'PR Size',
        value: 55,
        timestamp: new Date(),
        source: 'GitHub',
      },
    ];

    mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
    mockGitHubService.fetchData.mockResolvedValue(mockGitHubMetrics);

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(3);
    expect(result.metrics).toEqual(
      expect.arrayContaining([...mockSheetMetrics, ...mockGitHubMetrics]),
    );
    expect(result.errors).toHaveLength(0);
  });

  it('should handle errors from Google Sheets service', async () => {
    mockGoogleSheetsService.fetchData.mockRejectedValue(
      new Error('Google Sheets API error'),
    );
    mockGitHubService.fetchData.mockResolvedValue([]);

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: 'Google Sheets',
      message: 'Google Sheets API error',
    });
  });

  it('should handle errors from GitHub service', async () => {
    mockGoogleSheetsService.fetchData.mockResolvedValue([]);
    mockGitHubService.fetchData.mockRejectedValue(
      new Error('GitHub API error'),
    );

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: 'GitHub',
      message: 'GitHub API error',
    });
  });

  it('should handle errors from both services', async () => {
    mockGoogleSheetsService.fetchData.mockRejectedValue(
      new Error('Google Sheets API error'),
    );
    mockGitHubService.fetchData.mockRejectedValue(
      new Error('GitHub API error'),
    );

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        {
          source: 'Google Sheets',
          message: 'Google Sheets API error',
        },
        {
          source: 'GitHub',
          message: 'GitHub API error',
        },
      ]),
    );
  });

  it('should log errors from services', async () => {
    const googleSheetsError = new Error('Google Sheets API error');
    const gitHubError = new Error('GitHub API error');

    mockGoogleSheetsService.fetchData.mockRejectedValue(googleSheetsError);
    mockGitHubService.fetchData.mockRejectedValue(gitHubError);

    await metricsService.getAllMetrics();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching Google Sheets data:',
      googleSheetsError,
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching GitHub data:',
      gitHubError,
    );
  });
});
