// src/interfaces/IGoogleSheetsService.ts
import { IMetric } from './IMetricModel.js';

export interface IGoogleSheetsService {
  fetchData(
    progressCallback?: (progress: number, message: string) => void,
  ): Promise<IMetric[]>;
}
