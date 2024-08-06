import type { IPullRequest } from '@/interfaces';
import { MetricCalculator } from '@/services/metrics/MetricsCalculator';

describe('MetricCalculator', () => {
  let calculator: MetricCalculator;

  beforeEach(() => {
    calculator = new MetricCalculator();
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics', () => {
      const mockPullRequests: IPullRequest[] = [
        {
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
        },
        // ... add more mock pull requests as needed
      ];

      const metrics = calculator.calculateMetrics(mockPullRequests);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github-pr-cycle-time');
      expect(metrics[1].id).toBe('github-pr-size');
    });
  });

  describe('calculatePRCycleTime', () => {
    it('should calculate average cycle time correctly', () => {
      const mockPullRequests: IPullRequest[] = [
        {
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
        },
        // ... add more mock pull requests as needed
      ];

      const metric = (calculator as any).calculatePRSize(mockPullRequests);

      expect(metric.value).toBe(150); // 100 additions + 50 deletions = 150 lines
      expect(metric.unit).toBe('lines');
      expect(metric.additional_info).toBe('Based on 1 PRs');
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
        {
          number: 1,
          title: 'Test PR 1',
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
        },
      ];

      const metric = (calculator as any).calculatePRSize(mockPullRequests);

      expect(metric.value).toBe(150); // 100 additions + 50 deletions = 150 lines
      expect(metric.unit).toBe('lines');
      expect(metric.additional_info).toBe('Based on 1 PRs');
    });

    it('should handle empty pull requests array', () => {
      const metric = (calculator as any).calculatePRSize([]);

      expect(metric.value).toBe(0);
      expect(metric.additional_info).toBe('Based on 0 PRs');
    });
  });
});
