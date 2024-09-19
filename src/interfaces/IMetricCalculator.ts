// src/services/metrics/IMetricCalculator.ts
import type { IMetric } from './IMetricModel.js';
import type { IPullRequest } from './IPullRequest.js';

export interface IMetricCalculator {
  calculateMetrics(data: IPullRequest[] | IMetric[]): IMetric[];
}
