// src/__tests__/services/GitHubService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubService } from '../../services/GitHubService';
import type { IGitHubClient } from '../../interfaces/IGitHubClient';
import type { IConfig } from '../../interfaces/IConfig';
import type { ICacheService } from '../../interfaces/ICacheService';
import { createMockLogger } from '../../__mocks__/logger';
import type { Logger } from '../../utils/logger';

// Simple mock cache service
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

function createMockAsyncIterator<T>(items: T[]): AsyncIterableIterator<T> {
  let index = 0;
  return {
    async next() {
      if (index < items.length) {
        return { value: items[index++], done: false };
      } else {
        return { value: undefined as any, done: true };
      }
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let mockConfig: IConfig;
  let mockLogger: Logger;
  let mockCacheService: ICacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = {
      paginate: {
        iterator: jest.fn(),
      },
      request: jest.fn(),
    };
    mockConfig = {
      GITHUB_OWNER: 'fake-owner',
      GITHUB_REPO: 'fake-repo',
    } as IConfig;
    mockLogger = createMockLogger();
    mockCacheService = new MockCacheService();
    githubService = new GitHubService(
      mockGitHubClient,
      mockConfig,
      mockLogger,
      mockCacheService,
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 3 } });

    // Mock the current date
    jest.useFakeTimers().setSystemTime(new Date('2024-08-02'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch and calculate metrics from GitHub within the correct date range', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2024-07-01T00:00:00Z',
        merged_at: '2024-07-02T00:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2024-07-15T00:00:00Z',
        merged_at: '2024-07-16T12:00:00Z',
        additions: 30,
        deletions: 10,
      },
    ];

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: mockPullRequests }]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 2 } });

    const result = await githubService.fetchData();

    expect(result.metrics).toHaveLength(2);
    expect(result.totalPRs).toBe(2);
    expect(result.fetchedPRs).toBe(2);
    expect(result.timePeriod).toBe(90);
  });

  it('should handle PRs outside the date range', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2024-07-01T00:00:00Z',
        merged_at: '2024-07-02T00:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2024-04-15T00:00:00Z', // Outside 90-day range
        merged_at: '2024-04-16T12:00:00Z',
        additions: 30,
        deletions: 10,
      },
    ];

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: mockPullRequests }]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 2 } });

    const result = await githubService.fetchData();

    expect(result.metrics).toHaveLength(2);
    expect(result.totalPRs).toBe(2);
    expect(result.fetchedPRs).toBe(1); // Only one PR should be within range
  });

  it('should stop pagination when reaching PRs outside the date range', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2024-07-01T00:00:00Z',
        merged_at: '2024-07-02T00:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2024-04-15T00:00:00Z', // Outside 90-day range
        merged_at: '2024-04-16T12:00:00Z',
        additions: 30,
        deletions: 10,
      },
    ];

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: mockPullRequests }, { data: [] }]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 2 } });

    await githubService.fetchData();

    expect(mockGitHubClient.paginate.iterator).toHaveBeenCalledTimes(1);
  });

  it('should handle timeout during PR fetching', async () => {
    const mockPullRequests = Array(200).fill({
      number: 1,
      created_at: '2024-07-01T00:00:00Z',
      merged_at: '2024-07-02T00:00:00Z',
      additions: 50,
      deletions: 20,
    });

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([
        { data: mockPullRequests },
        { data: mockPullRequests.slice(0, 100) }, // Simulate partial data on second call
      ]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 200 } });

    // Mock Date.now to simulate timeout after first iteration
    const originalDateNow = Date.now;
    const mockedDateNow = jest
      .fn(() => 0)
      .mockReturnValueOnce(0)
      .mockReturnValue(600000) as jest.MockedFunction<typeof Date.now>;
    Date.now = mockedDateNow;

    const result = await githubService.fetchData();

    expect(result.fetchedPRs).toBeGreaterThan(0);
    expect(result.fetchedPRs).toBeLessThanOrEqual(200);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Operation timed out'),
    );

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should use the correct date range in getTotalPRCount', async () => {
    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: [] }]),
    );

    await githubService.fetchData();

    expect(mockGitHubClient.request).toHaveBeenCalledWith(
      'GET /search/issues',
      expect.objectContaining({
        q: expect.stringContaining('created:2024-05-04..2024-08-02'),
      }),
    );
  });

  it('should update progress correctly', async () => {
    const mockProgressCallback = jest.fn();
    const mockPullRequests = Array(100).fill({
      number: 1,
      created_at: '2024-07-01T00:00:00Z',
      merged_at: '2024-07-02T00:00:00Z',
      additions: 50,
      deletions: 20,
    });

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: mockPullRequests }]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 100 } });

    await githubService.fetchData(mockProgressCallback);

    expect(mockProgressCallback).toHaveBeenCalled();

    // Check for the initial progress call
    expect(mockProgressCallback).toHaveBeenCalledWith(
      0,
      'Starting to fetch GitHub data',
    );

    // Check for the final progress call
    expect(mockProgressCallback).toHaveBeenCalledWith(
      100,
      'Finished processing GitHub data',
    );

    // Check for a progress update during fetching
    const fetchingProgressCall = mockProgressCallback.mock.calls.find(
      call => typeof call[1] === 'string' && call[1].includes('Fetched'),
    );
    expect(fetchingProgressCall).toBeTruthy();
  });

  it('should handle empty pull request data', async () => {
    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([]),
    );
    mockGitHubClient.request.mockResolvedValue({ data: { total_count: 0 } });

    const result = await githubService.fetchData();

    expect(result.metrics).toHaveLength(2);
    expect(result.totalPRs).toBe(0);
    expect(result.fetchedPRs).toBe(0);
  });

  it('should calculate PR Cycle Time only for merged PRs', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2023-01-01T00:00:00Z',
        merged_at: '2023-01-02T00:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2023-01-02T00:00:00Z',
        merged_at: '2023-01-03T12:00:00Z',
        additions: 30,
        deletions: 10,
      },
      {
        number: 3,
        created_at: '2023-01-03T00:00:00Z',
        merged_at: null,
        additions: 20,
        deletions: 5,
      },
    ];

    mockGitHubClient.paginate.iterator.mockReturnValue(
      createMockAsyncIterator([{ data: mockPullRequests }]),
    );

    // Mock getTotalPRCount
    jest.spyOn(githubService as any, 'getTotalPRCount').mockResolvedValue(3);

    // Mock streamPullRequests to return the mockPullRequests
    jest
      .spyOn(githubService as any, 'streamPullRequests')
      .mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result.metrics).toHaveLength(2);
    expect(result.metrics).toEqual([
      {
        id: 'github-pr-cycle-time',
        metric_category: 'Efficiency',
        metric_name: 'PR Cycle Time',
        value: 30, // (24 + 36) / 2 = 30 hours average
        timestamp: expect.any(Date),
        unit: 'hours',
        additional_info: 'Based on 3 PRs',
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        metric_category: 'Code Quality',
        metric_name: 'PR Size',
        value: 45, // (70 + 40 + 25) / 3 = 45 lines average
        timestamp: expect.any(Date),
        unit: 'lines',
        additional_info: 'Based on 3 PRs',
        source: 'GitHub',
      },
    ]);
    expect(result.totalPRs).toBe(3);
    expect(result.fetchedPRs).toBe(3);
  });

  it('should throw an error when failing to fetch data', async () => {
    mockGitHubClient.request.mockRejectedValue(new Error('API error'));

    await expect(githubService.fetchData()).rejects.toThrow('API error');
  });

  it('should use cached data if available', async () => {
    const cachedData = {
      metrics: [
        {
          id: 'github-pr-cycle-time',
          metric_category: 'Efficiency',
          metric_name: 'PR Cycle Time',
          value: 25,
          timestamp: new Date(),
          unit: 'hours',
          additional_info: 'Based on X PRs',
          source: 'GitHub',
        },
        {
          id: 'github-pr-size',
          metric_category: 'Code Quality',
          metric_name: 'PR Size',
          value: 50,
          timestamp: new Date(),
          unit: 'lines',
          additional_info: 'Based on Y PRs',
          source: 'GitHub',
        },
      ],
      lastProcessedPage: 1,
      lastProcessedPR: 10,
      totalPRs: 20,
      fetchedPRs: 20,
    };

    jest.spyOn(mockCacheService, 'get').mockImplementation((key: string) => {
      if (key === `github-fake-owner/fake-repo-all-90`) {
        return cachedData;
      }
      return null;
    });

    const result = await githubService.fetchData();

    expect(result.metrics).toEqual(cachedData.metrics);
    expect(result.totalPRs).toBe(cachedData.totalPRs);
    expect(result.fetchedPRs).toBe(cachedData.fetchedPRs);
    expect(mockGitHubClient.paginate.iterator).not.toHaveBeenCalled();
    expect(mockGitHubClient.request).not.toHaveBeenCalled();
  });
});
