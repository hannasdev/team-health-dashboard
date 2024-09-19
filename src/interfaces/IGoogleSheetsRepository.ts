import type { IMetric } from './index.js';

export interface IGoogleSheetsRepository {
  fetchRawData(): Promise<any[][]>;
  storeMetrics(metrics: IMetric[]): Promise<void>;
  getMetrics(page: number, pageSize: number): Promise<IMetric[]>;
  getTotalMetricsCount(): Promise<number>;
  updateMetrics(metrics: IMetric[]): Promise<void>;
}
