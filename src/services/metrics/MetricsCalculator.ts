// src/services/metrics/MetricCalculator.ts
import { injectable } from 'inversify';

import { IMetricCalculator, IMetric, IFetchDataResult } from '@/interfaces';

@injectable()
export class MetricCalculator implements IMetricCalculator {
  calculateMetrics(data: IFetchDataResult[]): IMetric[] {
    let allMetrics: IMetric[] = [];

    for (const result of data) {
      if (result.source === 'GitHub') {
        allMetrics = [...allMetrics, ...this.calculateGitHubMetrics(result)];
      } else if (result.source === 'Google Sheets') {
        allMetrics = [
          ...allMetrics,
          ...this.calculateGoogleSheetsMetrics(result),
        ];
      }
    }

    return allMetrics;
  }

  private calculateGitHubMetrics(data: IFetchDataResult): IMetric[] {
    // GitHub-specific metric calculations
  }

  private calculateGoogleSheetsMetrics(data: IFetchDataResult): IMetric[] {
    // Google Sheets-specific metric calculations
  }
}
