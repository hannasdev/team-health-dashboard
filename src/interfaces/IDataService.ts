// src/interfaces/IDataService.ts
import { IMetric } from './IMetricModel.js';

export interface IDataService {
  fetchData(startDate?: Date, endDate?: Date): Promise<IMetric[]>;
}
