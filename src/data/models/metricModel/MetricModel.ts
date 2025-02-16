// src/models/Metric.ts
import type { IMetricModel } from './IMetricDocument.js';

export class MetricModel implements IMetricModel {
  constructor(
    public _id: string,
    public metric_category: string,
    public metric_name: string,
    public value: number,
    public timestamp: Date,
    public unit: string,
    public additional_info: string,
    public source: string,
  ) {}
}
