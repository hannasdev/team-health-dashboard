// src/interfaces/IMetricModel.ts

export interface IMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  source: string;
}
