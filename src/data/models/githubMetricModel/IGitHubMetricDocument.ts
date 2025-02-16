import { Document } from 'mongoose';

import { MetricModel } from '../metricModel/index';

export interface IGitHubMetricDocument
  extends Omit<MetricModel, '_id'>,
    Document {}
