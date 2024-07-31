// src/__tests__/services/GitHubService.test.ts
import 'reflect-metadata';
import { GitHubService } from '../../services/GitHubService';
import { IGitHubClient } from '../../interfaces/IGitHubClient';
import { IGitHubService } from '../../interfaces/IGitHubService';
import { IConfig } from '../../interfaces/IConfig';
import { Logger } from '../../utils/logger';
import { jest } from '@jest/globals';

describe('GitHubService', () => {
  let githubService: IGitHubService;
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let mockConfig: IConfig;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockGitHubClient = {
      paginate: jest.fn(),
    };
    mockConfig = {
      GITHUB_OWNER: 'fake-owner',
      GITHUB_REPO: 'fake-repo',
      // Add other required config properties with mock values
    } as IConfig;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    githubService = new GitHubService(mockGitHubClient, mockConfig, mockLogger);
  });

  it('should fetch and calculate metrics from GitHub', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2023-07-25T10:00:00Z',
        merged_at: '2023-07-27T10:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2023-07-26T10:00:00Z',
        merged_at: '2023-07-28T10:00:00Z',
        additions: 30,
        deletions: 10,
      },
    ];

    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'PR Cycle Time',
          value: 48,
          source: 'GitHub',
        }),
        expect.objectContaining({
          name: 'PR Size',
          value: 55,
          source: 'GitHub',
        }),
      ]),
    );
  });

  it('should handle empty pull request data', async () => {
    mockGitHubClient.paginate.mockResolvedValue([]);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'PR Cycle Time', value: 0 }),
        expect.objectContaining({ name: 'PR Size', value: 0 }),
      ]),
    );
  });

  it('should calculate PR Cycle Time only for merged PRs', async () => {
    const mockPullRequests = [
      {
        number: 1,
        created_at: '2023-07-25T10:00:00Z',
        merged_at: '2023-07-27T10:00:00Z',
        additions: 50,
        deletions: 20,
      },
      {
        number: 2,
        created_at: '2023-07-26T10:00:00Z',
        merged_at: null,
        additions: 30,
        deletions: 10,
      },
    ];

    mockGitHubClient.paginate.mockResolvedValue(mockPullRequests);

    const result = await githubService.fetchData();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'PR Cycle Time',
          value: 48,
          timestamp: expect.any(Date),
        }),
        expect.objectContaining({
          name: 'PR Size',
          value: 55,
          timestamp: expect.any(Date),
        }),
      ]),
    );
  });

  it('should throw an error when failing to fetch data', async () => {
    mockGitHubClient.paginate.mockRejectedValue(new Error('API error'));

    await expect(githubService.fetchData()).rejects.toThrow(
      'Failed to fetch data from GitHub',
    );
  });

  it('should log error when failing to fetch data', async () => {
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
