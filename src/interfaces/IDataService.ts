// src/interfaces/IDataService.ts
import { IMetric } from './IMetricModel';

export interface IDataService {
  fetchData(startDate?: Date, endDate?: Date): Promise<IMetric[]>;
}
