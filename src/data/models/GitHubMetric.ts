// src/data/models/GitHubMetric.ts
import mongoose, { Schema } from 'mongoose';

import type { IGitHubMetricDocument } from '../../interfaces/IGitHubMetricDocument';

const GitHubMetricSchema: Schema = new Schema({
  metric_category: { type: String, required: true },
  metric_name: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  unit: { type: String, required: true },
  additional_info: { type: String },
  source: { type: String, required: true, default: 'GitHub' },
});

export const GitHubMetricModel = mongoose.model<IGitHubMetricDocument>(
  'GitHubMetric',
  GitHubMetricSchema,
);
