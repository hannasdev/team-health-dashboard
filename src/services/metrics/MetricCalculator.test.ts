import type { IPullRequest } from '@/interfaces';
import { MetricCalculator } from '@/services/metrics/MetricsCalculator';

describe('MetricCalculator', () => {
  let calculator: MetricCalculator;

  beforeEach(() => {
    calculator = new MetricCalculator();
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics', () => {
      const pullRequests: IPullRequest[] = [
        {
          created_at: '2023-01-01T00:00:00Z',
          merged_at: '2023-01-02T00:00:00Z',
          additions: 10,
          deletions: 5,
        },
        {
          created_at: '2023-01-03T00:00:00Z',
          merged_at: '2023-01-05T00:00:00Z',
          additions: 20,
          deletions: 15,
        },
      ] as IPullRequest[];

      const metrics = calculator.calculateMetrics(pullRequests);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github-pr-cycle-time');
      expect(metrics[1].id).toBe('github-pr-size');
    });
  });

  describe('calculatePRCycleTime', () => {
    it('should calculate average cycle time correctly', () => {
      const pullRequests: IPullRequest[] = [
        {
          created_at: '2023-01-01T00:00:00Z',
          merged_at: '2023-01-02T00:00:00Z',
        },
        {
          created_at: '2023-01-03T00:00:00Z',
          merged_at: '2023-01-05T00:00:00Z',
        },
      ] as IPullRequest[];

      const metric = (calculator as any).calculatePRCycleTime(pullRequests);

      expect(metric.value).toBe(36); // (24 + 48) / 2 = 36 hours
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
      const pullRequests: IPullRequest[] = [
        { additions: 10, deletions: 5 },
        { additions: 20, deletions: 15 },
      ] as IPullRequest[];

      const metric = (calculator as any).calculatePRSize(pullRequests);

      expect(metric.value).toBe(25); // (15 + 35) / 2 = 25 lines
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
