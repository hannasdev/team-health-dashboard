// src/services/metrics/IMetricCalculator.ts
import type { IMetric } from './IMetricModel';
import type { IPullRequest } from './IPullRequest';

export interface IMetricCalculator {
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[];
}
