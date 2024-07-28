// src/models/Metric.ts
import { IMetric } from "../interfaces/IMetricModel";
export class Metric implements IMetric {
  constructor(
    public id: string,
    public name: string,
    public value: number,
    public timestamp: Date,
    public source: string
  ) {}
}
