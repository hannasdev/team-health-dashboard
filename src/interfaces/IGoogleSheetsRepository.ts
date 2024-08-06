import { IMetric } from './IMetricModel';
import { ProgressCallback } from '../types';

export interface IGoogleSheetsRepository {
  /**
   * Fetches metrics data from Google Sheets.
   *
   * @param progressCallback Optional callback for reporting progress.
   * @returns A promise that resolves to an array of metrics.
   */
  fetchMetrics(progressCallback?: ProgressCallback): Promise<IMetric[]>;
}
