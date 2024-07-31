// src/__tests__/services/GitHubService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubService } from '../../services/GitHubService';
import type { IGitHubClient } from '../../interfaces/IGitHubClient';
import type { IConfig } from '../../interfaces/IConfig';
import { createMockLogger } from '../../__mocks__/logger';
import type { Logger } from '../../utils/logger';

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let mockConfig: IConfig;
  let mockLogger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = { paginate: jest.fn() };
    mockConfig = {
      GITHUB_OWNER: 'fake-owner',
      GITHUB_REPO: 'fake-repo',
    } as IConfig;
    mockLogger = createMockLogger();
    githubService = new GitHubService(mockGitHubClient, mockConfig, mockLogger);
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

    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: 'github-pr-cycle-time',
        name: 'PR Cycle Time',
        value: 30, // (24 + 36) / 2 = 30 hours average
        timestamp: expect.any(Date),
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        name: 'PR Size',
        value: 55, // (70 + 40) / 2 = 55
        timestamp: expect.any(Date),
        source: 'GitHub',
      },
    ]);
  });

  it('should handle empty pull request data', async () => {
    mockGitHubClient.paginate.mockResolvedValue([]);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: 'github-pr-cycle-time',
        name: 'PR Cycle Time',
        value: 0,
        timestamp: expect.any(Date),
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        name: 'PR Size',
        value: 0,
        timestamp: expect.any(Date),
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

    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: 'github-pr-cycle-time',
        name: 'PR Cycle Time',
        value: 30, // (24 + 36) / 2 = 30 hours average (ignoring the unmerged PR)
        timestamp: expect.any(Date),
        source: 'GitHub',
      },
      {
        id: 'github-pr-size',
        name: 'PR Size',
        value: 45, // (70 + 40 + 25) / 3 = 45
        timestamp: expect.any(Date),
        source: 'GitHub',
      },
    ]);
  });

  it('should throw an error when failing to fetch data', async () => {
    const error = new Error('API error');
    mockGitHubClient.paginate.mockRejectedValue(error);

    await expect(githubService.fetchData()).rejects.toThrow(
      'Failed to fetch data from GitHub',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching data from GitHub:',
      error,
    );
  });
});
