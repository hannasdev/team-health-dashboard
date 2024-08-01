// src/interfaces/IGitHubService.ts
import { IMetric } from './IMetricModel';

export interface IGitHubService {
  fetchData(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IMetric[]>;
}
