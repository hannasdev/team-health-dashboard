// src/services/metrics/IMetricCalculator.ts
import type { IMetric } from './IMetricModel';

export interface IMetricCalculator {
  calculateMetrics(rawData: any[]): IMetric[];
}
