import { createMockMetric } from './mockMetricsService';

import type { IGoogleSheetsService } from '../../interfaces/index.js';

export function createMockGoogleSheetsService(): jest.Mocked<IGoogleSheetsService> {
  return {
    fetchRawData: jest.fn().mockResolvedValue(undefined),
    fetchAndStoreMetrics: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockResolvedValue([createMockMetric()]),
    syncMetrics: jest.fn().mockResolvedValue(undefined),
    getTotalMetricsCount: jest.fn().mockResolvedValue(100),
  };
}
