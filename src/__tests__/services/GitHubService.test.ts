// src/__tests__/services/GitHubService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubService } from '../../services/GitHubService';
import type { IGitHubClient } from '../../interfaces/IGitHubClient';
import type { IConfig } from '../../interfaces/IConfig';
import type { ICacheService } from '../../interfaces/ICacheService';
import type { IMetric } from '../../interfaces/IMetricModel';
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

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let mockConfig: IConfig;
  let mockLogger: Logger;
  let mockCacheService: ICacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = {
      paginate: jest.fn(),
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
  });

  it('should fetch and calculate metrics from GitHub', async () => {
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
    ];

    mockGitHubClient.paginate.mockReturnValue(
      createAsyncIterator([{ data: mockPullRequests }]),
    );

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'github-pr-cycle-time',
          metric_category: 'Efficiency',
          metric_name: 'PR Cycle Time',
          value: 30, // (24 + 36) / 2 = 30 hours average
          unit: 'hours',
          additional_info: expect.any(String),
          source: 'GitHub',
        }),
        expect.objectContaining({
          id: 'github-pr-size',
          metric_category: 'Code Quality',
          metric_name: 'PR Size',
          value: 55, // (70 + 40) / 2 = 55
          unit: 'lines',
          additional_info: expect.any(String),
          source: 'GitHub',
        }),
      ]),
    );
  });

  it('should handle empty pull request data', async () => {
    mockGitHubClient.paginate.mockReturnValue(createAsyncIterator([]));

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: 'github-pr-cycle-time',
        metric_category: 'Efficiency',
        metric_name: 'PR Cycle Time',
        value: 0,
        timestamp: expect.any(Date),
        unit: 'hours',
        additional_info: 'Based on 0 PRs',
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        metric_category: 'Code Quality',
        metric_name: 'PR Size',
        value: 0,
        timestamp: expect.any(Date),
        unit: 'lines',
        additional_info: 'Based on 0 PRs',
        source: 'GitHub',
      },
    ]);
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

    mockGitHubClient.paginate.mockReturnValue(
      createAsyncIterator([{ data: mockPullRequests }]),
    );

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: 'github-pr-cycle-time',
        metric_category: 'Efficiency',
        metric_name: 'PR Cycle Time',
        value: 30,
        timestamp: expect.any(Date),
        unit: 'hours',
        additional_info: 'Based on 3 PRs',
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        metric_category: 'Code Quality',
        metric_name: 'PR Size',
        value: 45,
        timestamp: expect.any(Date),
        unit: 'lines',
        additional_info: 'Based on 3 PRs',
        source: 'GitHub',
      },
    ]);
  });

  it('should throw an error when failing to fetch data', async () => {
    const error = new Error('API error');
    mockGitHubClient.paginate.mockImplementation(() => {
      throw error;
    });

    await expect(githubService.fetchData()).rejects.toThrow(
      'Failed to fetch data from GitHub',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching data from GitHub:',
      error,
    );
  });

  it('should use cached data if available', async () => {
    const cachedData: IMetric[] = [
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
    ];
    mockCacheService.set('github-fake-owner/fake-repo-all-all', cachedData);

    const result = await githubService.fetchData();

    expect(result).toEqual(cachedData);
    expect(mockGitHubClient.paginate).not.toHaveBeenCalled();
  });
});

function createAsyncIterator<T>(items: T[]): AsyncIterableIterator<T> {
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
