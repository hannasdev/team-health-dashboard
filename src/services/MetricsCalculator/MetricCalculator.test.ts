import { MetricCalculator } from './MetricsCalculator.js';

import type { IPullRequest } from '../../interfaces/index.js';

describe('MetricCalculator', () => {
  let calculator: MetricCalculator;

  beforeEach(() => {
    calculator = new MetricCalculator();
  });

  const createMockPullRequest = (
    overrides: Partial<IPullRequest> = {},
  ): IPullRequest => ({
    id: 'mock-id-' + Math.random().toString(36).substr(2, 9),
    number: 1,
    title: 'Test PR',
    state: 'closed',
    author: { login: 'user1' },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    closedAt: '2023-01-02T00:00:00Z',
    mergedAt: '2023-01-02T00:00:00Z',
    commits: { totalCount: 1 },
    additions: 100,
    deletions: 50,
    changedFiles: 3,
    baseRefName: 'main',
    baseRefOid: 'base-sha',
    headRefName: 'feature',
    headRefOid: 'head-sha',
    processed: false,
    processedAt: null,
    ...overrides,
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics', () => {
      const mockPullRequests: IPullRequest[] = [
        createMockPullRequest(),
        createMockPullRequest({ number: 2, additions: 200, deletions: 100 }),
      ];

      const metrics = calculator.calculateMetrics(mockPullRequests);

      expect(metrics).toHaveLength(3);
      expect(metrics[0]._id).toBe('github-pr-count');
      expect(metrics[1]._id).toBe('github-pr-cycle-time');
      expect(metrics[2]._id).toBe('github-avg-pr-size');
    });
  });

  describe('calculatePRCycleTime', () => {
    it('should calculate average cycle time correctly', () => {
      const mockPullRequests: IPullRequest[] = [
        createMockPullRequest(),
        createMockPullRequest({
          createdAt: '2023-01-01T00:00:00Z',
          mergedAt: '2023-01-03T00:00:00Z',
        }),
      ];

      const metric = (calculator as any).calculatePRCycleTime(mockPullRequests);

      expect(metric.value).toBe(36); // Average of 24 hours and 48 hours
      expect(metric.unit).toBe('hours');
      expect(metric.additional_info).toBe('Based on 2 merged PRs');
    });

    it('should handle empty pull requests array', () => {
      const metric = (calculator as any).calculatePRCycleTime([]);

      expect(metric.value).toBe(0);
      expect(metric.additional_info).toBe('Based on 0 merged PRs');
    });
  });

  describe('calculatePRSize', () => {
    it('should calculate average PR size correctly', () => {
      const mockPullRequests: IPullRequest[] = [
        createMockPullRequest(),
        createMockPullRequest({ additions: 200, deletions: 100 }),
      ];

      const metric = (calculator as any).calculatePRSize(mockPullRequests);

      expect(metric.value).toBe(225); // Average of (100+50) and (200+100)
      expect(metric.unit).toBe('lines');
      expect(metric.additional_info).toBe('Based on 2 PRs');
    });

    it('should handle empty pull requests array', () => {
      const metric = (calculator as any).calculatePRSize([]);

      expect(metric.value).toBe(0);
      expect(metric.additional_info).toBe('Based on 0 PRs');
    });
  });
});
