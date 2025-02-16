import type { Document } from 'mongoose';

export interface IGoogleSheetsMetricDocument extends Document {
  id: string;
  metric_category: string;
  metric_name: string;
  value: number;
  timestamp: Date;
  unit: string;
  additional_info: string;
  source: string;
}
