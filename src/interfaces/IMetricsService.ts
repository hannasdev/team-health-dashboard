// src/interfaces/IMetricsService.ts
import type { IMetric } from './IMetricModel.js';
import type { ProgressCallback } from '../types/index.js';

export interface IMetricsService {
  getAllMetrics(
    progressCallback?: ProgressCallback,
    timePeriod?: number,
  ): Promise<{
    metrics: IMetric[]; // Make sure IMetric is defined correctly
    errors: { source: string; message: string }[];
    githubStats: { totalPRs: number; fetchedPRs: number; timePeriod: number };
  }>;
  cancelOperation(): void;
}
