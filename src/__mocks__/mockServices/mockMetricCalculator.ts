import { createMockMetric } from './mockMetricsService';

import type { IMetric, IMetricCalculator } from '../../interfaces/index.js';

// Mock Metric Factories for Specific Calculations
export const createMockPRCountMetric = (pullRequestCount: number): IMetric =>
  createMockMetric({
    id: 'github-pr-count',
    metric_category: 'GitHub',
    metric_name: 'Pull Request Count',
    value: pullRequestCount,
    unit: 'count',
    additional_info: '',
  });

export const createMockPRCycleTimeMetric = (
  averageCycleTimeHours: number,
  mergedPRCount: number,
): IMetric =>
  createMockMetric({
    id: 'github-pr-cycle-time',
    metric_category: 'GitHub',
    metric_name: 'Average Time to Merge',
    value: averageCycleTimeHours,
    unit: 'hours',
    additional_info: `Based on ${mergedPRCount} merged PRs`,
  });

export const createMockPRSizeMetric = (
  averageSize: number,
  prCount: number,
): IMetric =>
  createMockMetric({
    id: 'github-avg-pr-size',
    metric_category: 'GitHub',
    metric_name: 'Average PR Size',
    value: averageSize,
    unit: 'lines',
    additional_info: `Based on ${prCount} PRs`,
  });

// Mock MetricCalculator
export const createMockMetricCalculator =
  (): jest.Mocked<IMetricCalculator> => ({
    calculateMetrics: jest.fn(),
  });
