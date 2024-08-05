import { IMetric } from './IMetricModel';

/**
 * Represents the result of fetching GitHub data.
 */
export interface IFetchDataResult {
  /** The calculated metrics */
  metrics: IMetric[];

  /** The total number of pull requests */
  totalPRs: number;

  /** The number of pull requests actually fetched */
  fetchedPRs: number;

  /** The time period (in days) for which the data was fetched */
  timePeriod: number;
}

export interface IFetchDataResult {
  metrics: any[]; // Raw data from the source
  errors: IError[];
  stats: Partial<IStats>;
}
