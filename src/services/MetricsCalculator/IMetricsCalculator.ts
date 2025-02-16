// src/services/metrics/IMetricCalculator.ts
import { MetricModel } from '../../data/models/metricModel/index.js';

import type { IPullRequest } from '../../data/repositories/GitHubRepository/index.js';

export interface IMetricsCalculator {
  calculateMetrics(data: IPullRequest[] | MetricModel[]): MetricModel[];
}
