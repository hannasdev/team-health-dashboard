// src/interfaces/IMetricsService.ts
import type { ProgressCallback } from '@/types';

import type { IMetric } from './IMetricModel';

export interface IMetricsService {
  getAllMetrics(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }>;
}
