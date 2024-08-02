// src/interfaces/IMetricsService.ts
import { IMetric } from './IMetricModel';

export type ProgressCallback = (
  progress: number,
  message: string,
  details?: Record<string, any>,
) => void;

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
