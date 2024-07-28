// src/interfaces/IDataService.ts
import { IMetric } from "./IMetricModel";

export interface IDataService {
  fetchData(): Promise<IMetric[]>;
}
