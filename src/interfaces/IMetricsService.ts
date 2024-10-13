// src/interfaces/IMetricsService.ts
import type { IMetric } from './index.js';

export interface IMetricsService {
  getAllMetrics(
    page: number,
    pageSize: number,
    timePeriod?: number,
  ): Promise<{
    metrics: IMetric[];
    githubStats: {
      totalPRs: number;
      fetchedPRs: number;
      timePeriod: number;
    };
    totalMetrics: number;
  }>;
  fetchAndStoreAllData(): Promise<void>;
  syncAllData(): Promise<void>;
  resetAllData(): Promise<void>;
}
