import { Container } from 'inversify';

import {
  createMockLogger,
  createMockGitHubRepository,
  createMockMetricCalculator,
  createMockProgressTracker,
} from '../../__mocks__/mockFactories.js';
import { Config } from '../../config/config.js';
import {
  IGitHubRepository,
  IMetricCalculator,
  IProgressTracker,
  ILogger,
  IMetric,
  IPullRequest,
  IGitHubService,
} from '../../interfaces/index.js';
import { GitHubService } from '../../services/github/GitHubService.js';
import { ProgressCallback } from '../../types/index.js';
import { TYPES } from '../../utils/types.js';

describe('GitHubService', () => {
  let container: Container;
  let gitHubService: IGitHubService;
  let mockGitHubRepository: jest.Mocked<IGitHubRepository>;
  let mockMetricCalculator: jest.Mocked<IMetricCalculator>;
  let mockProgressTracker: jest.Mocked<IProgressTracker>;
  let mockLogger: jest.Mocked<ILogger>;

  const testConfig = {
    REPO_OWNER: 'github_owner_test',
    REPO_REPO: 'github_repo_test',
    JWT_SECRET: 'test-secret',
    REPO_TOKEN: 'test-github-token',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test-google-sheets-private-key',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test-client-email@example.com',
    GOOGLE_SHEETS_SHEET_ID: 'test-sheet-id',
    MONGODB_URI: 'mongodb://localhost:27017/test-db',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:3000',
    NODE_ENV: 'test',
  };

  beforeEach(() => {
    const mockConfig = Config.getInstance(testConfig);
    mockLogger = createMockLogger();
    mockGitHubRepository = createMockGitHubRepository();
    mockMetricCalculator = createMockMetricCalculator();
    mockProgressTracker = createMockProgressTracker();

    container = new Container();
    container
      .bind<IGitHubRepository>(TYPES.GitHubRepository)
      .toConstantValue(mockGitHubRepository);
    container
      .bind<IMetricCalculator>(TYPES.MetricCalculator)
      .toConstantValue(mockMetricCalculator);
    container
      .bind<IProgressTracker>(TYPES.ProgressTracker)
      .toConstantValue(mockProgressTracker);
    container.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
    container.bind<IGitHubService>(TYPES.GitHubService).to(GitHubService);

    gitHubService = container.get<IGitHubService>(TYPES.GitHubService);

    jest.resetAllMocks();
  });

  it('should fetch pull requests and calculate metrics', async () => {
    const mockPRs: Partial<IPullRequest>[] = [
      { number: 1, createdAt: '2023-01-01T00:00:00Z' },
      { number: 2, createdAt: '2023-01-02T00:00:00Z' },
    ];

    mockGitHubRepository.fetchPullRequests.mockResolvedValue({
      pullRequests: mockPRs as IPullRequest[],
      totalPRs: mockPRs.length,
      fetchedPRs: mockPRs.length,
      timePeriod: 90,
    });

    const mockMetrics: IMetric[] = [
      {
        id: 'test-metric',
        metric_category: 'Test',
        metric_name: 'Test Metric',
        value: 42,
        timestamp: new Date(),
        unit: 'count',
        additional_info: '',
        source: 'GitHub',
      },
    ];

    mockMetricCalculator.calculateMetrics.mockReturnValue(mockMetrics);

    const result = await gitHubService.fetchData();

    expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
      90,
      expect.any(Function),
    );
    expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(mockPRs);
    expect(result).toEqual({
      metrics: mockMetrics,
      totalPRs: 2,
      fetchedPRs: 2,
      timePeriod: 90,
    });
  });

  it('should fetch data with custom time period', async () => {
    const customTimePeriod = 30;
    const mockPRs: Partial<IPullRequest>[] = [
      { number: 1, createdAt: '2023-01-01T00:00:00Z' },
    ];

    mockGitHubRepository.fetchPullRequests.mockResolvedValue({
      pullRequests: mockPRs as IPullRequest[],
      totalPRs: mockPRs.length,
      fetchedPRs: mockPRs.length,
      timePeriod: customTimePeriod,
    });
    mockMetricCalculator.calculateMetrics.mockReturnValue([]);

    const result = await gitHubService.fetchData(undefined, customTimePeriod);

    expect(mockGitHubRepository.fetchPullRequests).toHaveBeenCalledWith(
      customTimePeriod,
      expect.any(Function),
    );
    expect(result.timePeriod).toBe(customTimePeriod);
  });

  it('should use progress tracker and progress callback when provided', async () => {
    const progressCallback: ProgressCallback = jest.fn();
    const mockPRs: Partial<IPullRequest>[] = [
      { number: 1, createdAt: '2023-01-01T00:00:00Z' },
      { number: 2, createdAt: '2023-01-02T00:00:00Z' },
    ];

    mockGitHubRepository.fetchPullRequests.mockImplementation(
      async (timePeriod, callback) => {
        callback?.(1, 2, 'Fetching PR 1');
        callback?.(2, 2, 'Fetching PR 2');
        return {
          pullRequests: mockPRs as IPullRequest[],
          totalPRs: mockPRs.length,
          fetchedPRs: mockPRs.length,
          timePeriod,
        };
      },
    );

    await gitHubService.fetchData(progressCallback);

    expect(mockProgressTracker.trackProgress).toHaveBeenCalledTimes(2);
    expect(progressCallback).toHaveBeenCalledTimes(2);
    expect(mockMetricCalculator.calculateMetrics).toHaveBeenCalledWith(mockPRs);
  });

  it('should handle errors during fetch', async () => {
    const errorMessage = 'API Error';
    mockGitHubRepository.fetchPullRequests.mockRejectedValue(
      new Error(errorMessage),
    );

    await expect(gitHubService.fetchData()).rejects.toThrow(errorMessage);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching GitHub data:',
      expect.any(Error),
    );
    expect(mockMetricCalculator.calculateMetrics).not.toHaveBeenCalled();
  });

  it('should handle empty pull requests', async () => {
    mockGitHubRepository.fetchPullRequests.mockResolvedValue({
      pullRequests: [],
      totalPRs: 0,
      fetchedPRs: 0,
      timePeriod: 90,
    });
    mockMetricCalculator.calculateMetrics.mockReturnValue([]);

    const result = await gitHubService.fetchData();

    expect(result).toEqual({
      metrics: [],
      totalPRs: 0,
      fetchedPRs: 0,
      timePeriod: 90,
    });
  });
});
