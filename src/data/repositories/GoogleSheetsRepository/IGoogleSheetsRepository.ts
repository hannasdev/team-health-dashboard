import { MetricModel } from '../../models/metricModel/index.js';

import type { IMetricDocument } from '../../models/metricModel/index.js';

export interface IGoogleSheetsRepository {
  fetchRawData(): Promise<any[][]>;
  storeMetrics(metrics: IMetricDocument[]): Promise<void>;
  getMetrics(page: number, pageSize: number): Promise<MetricModel[]>;
  getTotalMetricsCount(): Promise<number>;
  updateMetrics(metrics: IMetricDocument[]): Promise<void>;
  deleteAllMetrics(): Promise<void>;
}
