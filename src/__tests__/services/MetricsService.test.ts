import 'reflect-metadata';
import { MetricsService } from '../../services/MetricsService';
import { IGoogleSheetsService } from '../../interfaces/IGoogleSheetsService';
import { IGitHubService } from '../../interfaces/IGitHubService';
import { IMetricsService } from '../../interfaces/IMetricsService';
import { IMetric } from '../../interfaces/IMetricModel';
import { createMockLogger, MockLogger } from '../../__mocks__/logger';
import { Logger } from '../../utils/logger';
import { ICacheService } from '../../interfaces/ICacheService';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

class MockCacheService implements ICacheService {
  private store: { [key: string]: any } = {};

  get<T>(key: string): T | null {
    return this.store[key] || null;
  }

  set<T>(key: string, value: T): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('MetricsService', () => {
  let metricsService: IMetricsService;
  let mockGoogleSheetsService: jest.Mocked<IGoogleSheetsService>;
  let mockGitHubService: jest.Mocked<IGitHubService>;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockGoogleSheetsService = { fetchData: jest.fn() };
    mockGitHubService = { fetchData: jest.fn() };
    mockLogger = createMockLogger();
    metricsService = new MetricsService(
      mockGoogleSheetsService,
      mockGitHubService,
      mockLogger as Logger,
    );
  });

  it('should fetch and combine metrics from Google Sheets and GitHub with progress updates', async () => {
    const mockSheetMetrics: IMetric[] = [
      {
        id: 'sheet-1',
        metric_category: 'Test Category',
        metric_name: 'Test Metric',
        value: 10,
        timestamp: new Date(),
        unit: 'count',
        additional_info: 'Test info',
        source: 'Google Sheets',
      },
    ];
    const mockGitHubResult = {
      metrics: [
        {
          id: 'github-1',
          metric_category: 'Test Category',
          metric_name: 'Test Metric',
          value: 20,
          timestamp: new Date(),
          unit: 'count',
          additional_info: 'Test info',
          source: 'GitHub',
        },
      ],
      totalPRs: 10,
      fetchedPRs: 10,
      timePeriod: 90,
    };

    mockGoogleSheetsService.fetchData.mockResolvedValue(mockSheetMetrics);
    mockGitHubService.fetchData.mockResolvedValue(mockGitHubResult);

    const mockProgressCallback = jest.fn();

    const result = await metricsService.getAllMetrics(mockProgressCallback);

    expect(result.metrics).toHaveLength(2);
    expect(result.metrics).toEqual(
      expect.arrayContaining([
        ...mockSheetMetrics,
        ...mockGitHubResult.metrics,
      ]),
    );
    expect(result.errors).toHaveLength(0);
    expect(result.githubStats).toEqual({
      totalPRs: 10,
      fetchedPRs: 10,
      timePeriod: 90,
    });

    expect(mockProgressCallback).toHaveBeenCalledTimes(4);
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      1,
      0,
      'Google Sheets: Starting to fetch Google Sheets data',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      2,
      50,
      'Google Sheets: Finished fetching Google Sheets data',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      3,
      50,
      'GitHub: Starting to fetch GitHub data',
    );
    expect(mockProgressCallback).toHaveBeenNthCalledWith(
      4,
      100,
      'GitHub: Finished fetching GitHub data',
    );
  });

  it('should handle errors from Google Sheets service', async () => {
    mockGoogleSheetsService.fetchData.mockRejectedValue(
      new Error('Google Sheets API error'),
    );
    mockGitHubService.fetchData.mockResolvedValue({
      metrics: [],
      totalPRs: 0,
      fetchedPRs: 0,
      timePeriod: 90,
    });

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
        { source: 'Google Sheets', message: 'Google Sheets API error' },
        { source: 'GitHub', message: 'GitHub API error' },
      ]),
    );

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

  it('should deduplicate metrics from different sources', async () => {
    const sheetMetric = {
      id: 'metric-1',
      metric_category: 'Test Category',
      metric_name: 'Test Metric',
      value: 10,
      timestamp: new Date(2023, 0, 1),
      unit: 'count',
      additional_info: 'Sheet info',
      source: 'Google Sheets',
    };

    const githubMetric = {
      ...sheetMetric,
      value: 20,
      timestamp: new Date(2023, 0, 2),
      additional_info: 'GitHub info',
      source: 'GitHub',
    };

    mockGoogleSheetsService.fetchData.mockResolvedValue([sheetMetric]);
    mockGitHubService.fetchData.mockResolvedValue({
      metrics: [githubMetric],
      totalPRs: 1,
      fetchedPRs: 1,
      timePeriod: 90,
    });

    const result = await metricsService.getAllMetrics();

    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0]).toEqual(githubMetric); // The GitHub metric should be chosen as it has a later timestamp
  });
});
