// src/interfaces/IMetricsService.ts
import { IMetric } from "./IMetricModel";

export interface IMetricsService {
  getAllMetrics(): Promise<{
    metrics: IMetric[];
    errors: { source: string; message: string }[];
  }>;
}
