import { createMockMetric } from './mockMetricsService.js';

import type { IGitHubService } from '../../interfaces/index.js';

/**
 * Mock GitHub service
 * @returns {IGitHubService}
 */
export function createMockGitHubService(): jest.Mocked<IGitHubService> {
  return {
    fetchAndStoreRawData: jest.fn().mockResolvedValue(undefined),
    getProcessedMetrics: jest
      .fn()
      .mockResolvedValue([
        createMockMetric({ id: 'github-pr-count', source: 'GitHub' }),
        createMockMetric({ id: 'github-pr-cycle-time', source: 'GitHub' }),
        createMockMetric({ id: 'github-pr-size', source: 'GitHub' }),
      ]),
    syncData: jest.fn().mockResolvedValue(undefined),
    getTotalPRCount: jest.fn().mockResolvedValue(100),
  };
}
