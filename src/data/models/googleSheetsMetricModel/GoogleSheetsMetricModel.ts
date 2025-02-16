// src/data/models/GoogleSheetsMetric.ts

import { Schema, model } from 'mongoose';

import type { IGoogleSheetsMetricDocument } from './IGoogleSheetsMetricDocument.js';

const GoogleSheetsMetricSchema = new Schema<IGoogleSheetsMetricDocument>({
  metric_category: { type: String, required: true },
  metric_name: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  unit: { type: String, required: true },
  additional_info: { type: String },
  source: { type: String, required: true },
});

export const GoogleSheetsMetricModel = model<IGoogleSheetsMetricDocument>(
  'GoogleSheetsMetric',
  GoogleSheetsMetricSchema,
);
