// src/interfaces/IGitHubService.ts
import { IMetric } from './index.js';

export interface IGitHubService {
  fetchAndStoreRawData(timePeriod: number): Promise<void>;
  getProcessedMetrics(page: number, pageSize: number): Promise<IMetric[]>;
  syncData(timePeriod: number): Promise<void>;
  getTotalPRCount(): Promise<number>;
}
