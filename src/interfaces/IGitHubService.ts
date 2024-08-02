// src/interfaces/IGitHubService.ts
import { IMetric } from './IMetricModel';

export interface IGitHubService {
  fetchData(
    progressCallback?: (
      progress: number,
      message: string,
      details?: any,
    ) => void,
    timePeriod?: number,
  ): Promise<{
    metrics: IMetric[];
    totalPRs: number;
    fetchedPRs: number;
    timePeriod: number;
  }>;
}
