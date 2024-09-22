import { Document } from 'mongoose';

import { IMetric } from './IMetricModel.js';

export interface IGitHubMetricDocument extends Omit<IMetric, '_id'>, Document {}
