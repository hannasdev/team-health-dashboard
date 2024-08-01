// src/interfaces/IMetricsService.ts
import type { IMetric } from './IMetricModel';

export type ProgressCallback = (
  progress: number,
  message: string,
  details?: Record<string, any>,
) => void;

export interface IMetricsService {
  getAllMetrics(
    progressCallback: ProgressCallback,
  ): Promise<{ metrics: IMetric[]; errors: any[] }>;
}
