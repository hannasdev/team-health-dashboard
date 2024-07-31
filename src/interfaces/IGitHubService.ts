// src/interfaces/IGitHubService.ts
import { IMetric } from './IMetricModel';

export interface IGitHubService {
  fetchData(startDate?: Date, endDate?: Date): Promise<IMetric[]>;
}
