import { Document, Types } from 'mongoose';

export interface IMetricModel {
  _id: string | Types.ObjectId;
  metric_category: string;
  metric_name: string;
  value: number;
  timestamp: Date;
  unit: string;
  additional_info: string;
  source: string;
}

export interface IMetricDocument extends Omit<IMetricModel, '_id'>, Document {}
