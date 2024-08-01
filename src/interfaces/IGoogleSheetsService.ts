// src/interfaces/IGoogleSheetsService.ts
import { IMetric } from './IMetricModel';

export interface IGoogleSheetsService {
  fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]>;
}
