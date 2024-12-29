import type { IMetricsService, IMetric } from '../../interfaces/index.js';
import type { Types } from 'mongoose';

/**
 * Creates a mock metrics service with predefined behavior
 */
export function createMockMetricsService(): jest.Mocked<IMetricsService> {
  return {
    // Mock getAllMetrics with proper typing
    getAllMetrics: jest.fn().mockImplementation(
      async (
        page: number,
        pageSize: number,
      ): Promise<{
        metrics: IMetric[];
        githubStats: {
          totalPRs: number;
          fetchedPRs: number;
          timePeriod: number;
        };
      }> => {
        return {
          metrics: [
            createMockMetric({ _id: 'github-pr-count', source: 'GitHub' }),
            createMockMetric({ _id: 'github-pr-cycle-time', source: 'GitHub' }),
            createMockMetric({ _id: 'github-pr-size', source: 'GitHub' }),
            createMockMetric({ source: 'Google Sheets' }),
            createMockMetric({ source: 'Google Sheets' }),
          ],
          githubStats: {
            totalPRs: 10,
            fetchedPRs: 3,
            timePeriod: 90,
          },
        };
      },
    ),
    // Mock other methods with proper void return types
    syncAllData: jest.fn().mockImplementation(async (): Promise<void> => {}),
    fetchAndStoreAllData: jest
      .fn()
      .mockImplementation(async (): Promise<void> => {}),
    resetAllData: jest.fn().mockImplementation(async (): Promise<void> => {}),
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
  _id: `metric-${Math.random().toString(36).substr(2, 9)}` as unknown as Types.ObjectId,
  metric_category: 'Test Category',
  metric_name: 'Test Metric',
  value: 100,
  timestamp: new Date(),
  unit: 'unit',
  additional_info: 'Test info',
  source: 'Test Source',
  ...overrides,
});
