import { IMetric, IError, IStats } from '@/interfaces';

export interface IMetricsResult {
  metrics: IMetric[];
  errors: IError[];
  stats: IStats;
}
