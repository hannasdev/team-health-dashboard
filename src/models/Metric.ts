// src/models/Metric.ts
export interface IMetric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
}

export class Metric implements IMetric {
  constructor(
    public id: string,
    public name: string,
    public value: number,
    public timestamp: Date
  ) {}
}
