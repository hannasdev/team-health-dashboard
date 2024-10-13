// src/interfaces/IMetricsService.ts
import type { IMetric } from './index.js';

export interface IMetricsService {
  fetchAndStoreAllData(): Promise<void>;
  getAllMetrics(
    page: number,
    pageSize: number,
  ): Promise<{
    metrics: IMetric[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }>;
  syncAllData(): Promise<void>;
  resetAllData(): Promise<void>;
}
