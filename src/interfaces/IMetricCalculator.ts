// src/services/metrics/IMetricCalculator.ts
import type { IMetric } from './IMetricModel.js';
import type { IPullRequest } from './IPullRequest.js';

export interface IMetricCalculator {
  calculateMetrics(pullRequests: IPullRequest[]): IMetric[];
}
