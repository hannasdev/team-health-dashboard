// src/interfaces/IGoogleSheetsService.ts
import { IMetric } from './IMetricModel.js';

export interface IGoogleSheetsService {
  fetchRawData(): Promise<any[][]>;
  fetchAndStoreMetrics(): Promise<void>;
  getMetrics(page: number, pageSize: number): Promise<IMetric[]>;
  syncMetrics(): Promise<void>;
  getTotalMetricsCount(): Promise<number>;
}
