// src/models/Metric.ts
import type { IMetric } from '../interfaces/IMetricModel.js';

export class Metric implements IMetric {
  constructor(
    public id: string,
    public metric_category: string,
    public metric_name: string,
    public value: number,
    public timestamp: Date,
    public unit: string,
    public additional_info: string,
    public source: string,
  ) {}
}
