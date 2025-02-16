// src/interfaces/IGoogleSheetsService.ts
import { MetricModel } from '../..//data/models/metricModel/index.js';

export interface IGoogleSheetsService {
  fetchRawData(): Promise<any[][]>;
  fetchAndStoreMetrics(): Promise<void>;
  getMetrics(page: number, pageSize: number): Promise<MetricModel[]>;
  syncMetrics(): Promise<void>;
  getTotalMetricsCount(): Promise<number>;
  resetData(): Promise<void>;
}
