import { createMockMetric } from '../mockServices';

import type { IGitHubRepository, IPullRequest } from '../../interfaces/index';

export const createMockGitHubRepository =
  (): jest.Mocked<IGitHubRepository> => ({
    fetchPullRequests: jest.fn().mockResolvedValue({
      pullRequests: [createMockPullRequest()],
      totalPRs: 1,
      fetchedPRs: 1,
      timePeriod: 90,
    }),
    storeRawPullRequests: jest.fn().mockResolvedValue(undefined),
    getRawPullRequests: jest.fn().mockResolvedValue([createMockPullRequest()]),
    storeProcessedMetrics: jest.fn().mockResolvedValue(undefined),
    getProcessedMetrics: jest.fn().mockResolvedValue([createMockMetric()]),
    getTotalPRCount: jest.fn().mockResolvedValue(1),
    syncPullRequests: jest.fn().mockResolvedValue(undefined),
    markPullRequestsAsProcessed: jest.fn().mockResolvedValue(undefined),
    deleteAllMetrics: jest.fn().mockResolvedValue(undefined),
    resetProcessedFlags: jest.fn().mockResolvedValue(undefined),
    deleteAllPullRequests: jest.fn().mockResolvedValue(undefined),
  });

export const createMockGitHubPullRequest = (
  overrides: Partial<IPullRequest> = {},
): IPullRequest => ({
  id: 'mock-id',
  number: 1,
  title: 'Test PR',
  state: 'open',
  author: { login: 'testuser' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  closedAt: null,
  mergedAt: null,
  additions: 10,
  deletions: 5,
  changedFiles: 2,
  commits: { totalCount: 1 },
  baseRefName: 'main',
  baseRefOid: 'base-sha',
  headRefName: 'feature',
  headRefOid: 'head-sha',
  processed: false,
  processedAt: null,
  ...overrides,
});

export const createMockPullRequest = (
  overrides: Partial<IPullRequest> = {},
): IPullRequest => ({
  id: 'some-mock-id',
  number: 1,
  title: 'Test PR',
  state: 'open',
  author: { login: 'testuser' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  closedAt: null,
  mergedAt: null,
  commits: { totalCount: 1 },
  additions: 10,
  deletions: 5,
  changedFiles: 2,
  baseRefName: 'main',
  baseRefOid: 'base-sha',
  headRefName: 'feature',
  headRefOid: 'head-sha',
  processed: false,
  processedAt: null,
  ...overrides,
});
