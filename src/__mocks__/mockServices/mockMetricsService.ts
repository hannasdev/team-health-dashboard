import type { IMetricsService, IMetric } from '../../interfaces/index.js';

export function createMockMetricsService(): jest.Mocked<IMetricsService> {
  return {
    getAllMetrics: jest
      .fn()
      .mockImplementation(
        async (page: number, pageSize: number, timePeriod?: number) => {
          return {
            metrics: [
              createMockMetric({ _id: 'github-pr-count', source: 'GitHub' }),
              createMockMetric({
                _id: 'github-pr-cycle-time',
                source: 'GitHub',
              }),
              createMockMetric({ _id: 'github-pr-size', source: 'GitHub' }),
              createMockMetric({ source: 'Google Sheets' }),
              createMockMetric({ source: 'Google Sheets' }),
            ],
            githubStats: {
              totalPRs: 10,
              fetchedPRs: 3,
              timePeriod: timePeriod || 90,
            },
          };
        },
      ),
    syncAllData: jest.fn().mockResolvedValue(undefined),
    fetchAndStoreAllData: jest.fn().mockResolvedValue(undefined),
    resetAllData: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Mock Metric Factory (Generic)
 * @param overrides
 * @returns
 */
export const createMockMetric = (
  overrides: Partial<IMetric> = {},
): IMetric => ({
  _id: `metric-${Math.random().toString(36).substr(2, 9)}`,
  metric_category: 'Test Category',
  metric_name: 'Test Metric',
  value: 100,
  timestamp: new Date(),
  unit: 'unit',
  additional_info: 'Test info',
  source: 'Test Source',
  ...overrides,
});
