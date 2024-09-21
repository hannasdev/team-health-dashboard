import { Document, Types } from 'mongoose';

export interface IMetric {
  _id: string | Types.ObjectId; // CHANGED: Made _id required
  metric_category: string;
  metric_name: string;
  value: number;
  timestamp: Date;
  unit: string;
  additional_info: string;
  source: string;
}

export interface IMetricDocument extends Omit<IMetric, '_id'>, Document {}
