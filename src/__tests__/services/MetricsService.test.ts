// src/__tests__/services/MetricsService.test.ts
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

  it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
    const mockSheetMetrics = [
      {
        id: 'sheet-1',
        metric_category: 'Efficiency',
        metric_name: 'Cycle Time',
        value: 3,
        timestamp: new Date('2023-07-27T10:00:00Z'),
        unit: 'days',
        additional_info: '',
        source: 'Google Sheets',
      },
    ];
    const mockGitHubMetrics = [
      {
        id: 'github-1',
        metric_category: 'Efficiency',
        metric_name: 'PR Cycle Time',
        value: 48,
        timestamp: new Date(),
        unit: 'hours',
        additional_info: 'Based on X PRs',
        source: 'GitHub',
      },
      {
        id: 'github-2',
        metric_category: 'Code Quality',
        metric_name: 'PR Size',
        value: 55,
        timestamp: new Date(),
        unit: 'lines',
        additional_info: 'Based on Y PRs',
        source: 'GitHub',
      },
    ];

    mockGoogleSheetsService.fetchData.mockImplementation(async callback => {
      if (callback) {
        callback(50, 'Google Sheets data fetched');
      }
      return mockSheetMetrics;
    });

    mockGitHubService.fetchData.mockImplementation(async callback => {
      if (callback) {
        callback(50, 'GitHub data fetched');
      }
      return mockGitHubMetrics;
    });

    const mockProgressCallback = jest.fn();

    const result = await metricsService.getAllMetrics(mockProgressCallback);

    expect(result.metrics).toHaveLength(3);
    expect(result.metrics).toEqual(
      expect.arrayContaining([...mockSheetMetrics, ...mockGitHubMetrics]),
    );
    expect(result.errors).toHaveLength(0);

    expect(mockProgressCallback).toHaveBeenCalledTimes(4);
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      1,
      0,
      'Google Sheets: Starting to fetch Google Sheets data',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      2,
      25,
      'Google Sheets: Google Sheets data fetched',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      3,
      50,
      'GitHub: Starting to fetch GitHub data',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      4,
      75,
      'GitHub: GitHub data fetched',
    );
  });

  it('should handle errors from Google Sheets service with progress updates', async () => {
    mockGoogleSheetsService.fetchData.mockRejectedValue(
      new Error('Google Sheets API error'),
    );
    mockGitHubService.fetchData.mockResolvedValue([]);

    const mockProgressCallback = jest.fn();

    const result = await metricsService.getAllMetrics(mockProgressCallback);

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: 'Google Sheets',
      message: 'Google Sheets API error',
    });

    // Progress callback should still be called for GitHub service
    expect(mockProgressCallback).toHaveBeenCalledWith(
      50,
      'GitHub: Starting to fetch GitHub data',
    );
  });

  it('should handle errors from GitHub service with progress updates', async () => {
    mockGoogleSheetsService.fetchData.mockResolvedValue([]);
    mockGitHubService.fetchData.mockRejectedValue(
      new Error('GitHub API error'),
    );

    const mockProgressCallback = jest.fn();

    const result = await metricsService.getAllMetrics(mockProgressCallback);

    expect(result.metrics).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      source: 'GitHub',
      message: 'GitHub API error',
    });

    // Progress callback should still be called for Google Sheets service
    expect(mockProgressCallback).toHaveBeenCalledWith(
      0,
      'Google Sheets: Starting to fetch Google Sheets data',
    );
  });

  it('should handle errors from both services with progress updates', async () => {
    mockGoogleSheetsService.fetchData.mockRejectedValue(
      new Error('Google Sheets API error'),
    );
    mockGitHubService.fetchData.mockRejectedValue(
      new Error('GitHub API error'),
    );

    const mockProgressCallback = jest.fn();

    const result = await metricsService.getAllMetrics(mockProgressCallback);

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

    // Progress callbacks should still be called for both services
    expect(mockProgressCallback).toHaveBeenCalledWith(
      0,
      'Google Sheets: Starting to fetch Google Sheets data',
    );
    expect(mockProgressCallback).toHaveBeenCalledWith(
      50,
      'GitHub: Starting to fetch GitHub data',
    );
  });

  it('should log errors from services', async () => {
    const googleSheetsError = new Error('Google Sheets API error');
    const gitHubError = new Error('GitHub API error');

    mockGoogleSheetsService.fetchData.mockRejectedValue(googleSheetsError);
    mockGitHubService.fetchData.mockRejectedValue(gitHubError);

    const mockProgressCallback = jest.fn();

    await metricsService.getAllMetrics(mockProgressCallback);

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
