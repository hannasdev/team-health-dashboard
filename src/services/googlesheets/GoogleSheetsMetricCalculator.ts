// GoogleSheetsMetricCalculator.ts
import { injectable } from 'inversify';

import { IMetric } from '@/interfaces';

import { BaseMetricCalculator } from '../base/BaseMetricCalculator';

@injectable()
export class GoogleSheetsMetricCalculator extends BaseMetricCalculator {
  calculateMetrics(sheetData: IMetric[]): IMetric[] {
    return [
      this.calculateAverageMetric(sheetData, 'Efficiency'),
      this.calculateAverageMetric(sheetData, 'Code Quality'),
      // Add more metric calculations as needed
    ];
  }

  protected getSourceName(): string {
    return 'Google Sheets';
  }

  private calculateAverageMetric(
    metrics: IMetric[],
    category: string,
  ): IMetric {
    const categoryMetrics = metrics.filter(m => m.metric_category === category);
    const averageValue =
      categoryMetrics.reduce((sum, m) => sum + m.value, 0) /
      categoryMetrics.length;

    return {
      id: `${this.getSourceName().toLowerCase()}-avg-${category
        .toLowerCase()
        .replace(' ', '-')}`,
      metric_category: category,
      metric_name: `Average ${category}`,
      value: Math.round(averageValue * 100) / 100, // Round to 2 decimal places
      timestamp: new Date(),
      unit: categoryMetrics[0]?.unit || '',
      additional_info: `Based on ${categoryMetrics.length} metrics`,
      source: this.getSourceName(),
    };
  }
}
